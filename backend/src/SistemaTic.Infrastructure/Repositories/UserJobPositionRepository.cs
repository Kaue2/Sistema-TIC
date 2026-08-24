using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class UserJobPositionRepository : IUserJobPositionRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public UserJobPositionRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static UserJobPosition Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        Guid userId = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
        Guid jobPositionId = reader.IsDBNull(2) ? Guid.Empty : reader.GetGuid(2);
        DateOnly startsOn = reader.IsDBNull(3) ? DateOnly.MinValue : reader.GetFieldValue<DateOnly>(3);
        DateOnly? endsOn = reader.IsDBNull(4) ? null : reader.GetFieldValue<DateOnly>(4);
        string? notes = reader.IsDBNull(5) ? null : reader.GetString(5);
        Guid? createdByUserId = reader.IsDBNull(6) ? null : reader.GetGuid(6);
        DateTimeOffset createdAt = reader.IsDBNull(7) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(7);
        DateTimeOffset updatedAt = reader.IsDBNull(8) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(8);

        return new UserJobPosition(id, userId, jobPositionId, startsOn, endsOn, notes, createdByUserId, createdAt, updatedAt);
    }

    public async Task<UserJobPosition?> GetCurrentAsync(Guid userId)
    {
        await using var cmd = _dataSource.CreateCommand("""
            SELECT * FROM user_job_positions WHERE user_id = @userId AND ends_on IS NULL
        """);
        cmd.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }
        return null;
    }

    public async Task<IEnumerable<UserJobPosition>> GetHistoryAsync(Guid userId)
    {
        List<UserJobPosition> history = new List<UserJobPosition>();
        await using var cmd = _dataSource.CreateCommand("""
            SELECT * FROM user_job_positions WHERE user_id = @userId ORDER BY starts_on DESC
        """);
        cmd.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            history.Add(Map(reader));
        }
        return history;
    }

    public async Task<UserJobPosition> AssignAsync(Guid userId, Guid jobPositionId, DateOnly startsOn, string? notes, Guid? createdByUserId)
    {
        // sem try/catch: se algo estourar, o Dispose da transaction (via "await using") já faz o rollback
        await using var connection = await _dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        // só existe um cargo "atual" por usuário (ends_on IS NULL), então fecha o anterior antes de abrir o novo
        await using var closeCmd = connection.CreateCommand();
        closeCmd.Transaction = transaction;
        closeCmd.CommandText = """
            UPDATE user_job_positions
            SET ends_on = @endsOn
            WHERE user_id = @userId AND ends_on IS NULL;
        """;
        closeCmd.Parameters.AddWithValue("userId", userId);
        closeCmd.Parameters.AddWithValue("endsOn", startsOn.AddDays(-1));
        await closeCmd.ExecuteNonQueryAsync();

        await using var insertCmd = connection.CreateCommand();
        insertCmd.Transaction = transaction;
        insertCmd.CommandText = """
            INSERT INTO user_job_positions (user_id, job_position_id, starts_on, notes, created_by_user_id)
            VALUES (@userId, @jobPositionId, @startsOn, @notes, @createdByUserId)
            RETURNING *;
        """;
        insertCmd.Parameters.AddWithValue("userId", userId);
        insertCmd.Parameters.AddWithValue("jobPositionId", jobPositionId);
        insertCmd.Parameters.AddWithValue("startsOn", startsOn);
        insertCmd.Parameters.AddWithValue("notes", (object?)notes ?? DBNull.Value);
        insertCmd.Parameters.AddWithValue("createdByUserId", (object?)createdByUserId ?? DBNull.Value);

        await using var reader = await insertCmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var created = Map(reader);
        await reader.CloseAsync();

        await transaction.CommitAsync();
        return created;
    }
}
