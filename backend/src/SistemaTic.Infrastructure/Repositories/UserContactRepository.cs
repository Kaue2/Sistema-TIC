using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Application.DTO;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class UserContactRepository : IUserContactRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public UserContactRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static UserContact Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        Guid userId = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
        string contactType = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
        string contactValue = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
        string? label = reader.IsDBNull(4) ? null : reader.GetString(4);
        bool isPrimary = reader.IsDBNull(5) ? false : reader.GetBoolean(5);
        DateTimeOffset createdAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);
        DateTimeOffset updatedAt = reader.IsDBNull(7) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(7);

        return new UserContact(id, userId, contactType, contactValue, label, isPrimary, createdAt, updatedAt);
    }

    public async Task<IEnumerable<UserContact>> GetByUserIdAsync(Guid userId)
    {
        List<UserContact> contacts = new List<UserContact>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM user_contacts WHERE user_id = @userId ORDER BY contact_type, created_at");
        cmd.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            contacts.Add(Map(reader));
        }
        return contacts;
    }

    public async Task<UserContact> CreateAsync(Guid userId, string contactType, string contactValue, string label, bool isPrimary)
    {
        await using var connection = await _dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        // só pode existir um contato principal por tipo, então derruba o antigo antes de inserir o novo
        if (isPrimary)
        {
            await using var clearPrimaryCmd = connection.CreateCommand();
            clearPrimaryCmd.Transaction = transaction;
            clearPrimaryCmd.CommandText = """
                UPDATE user_contacts SET is_primary = false
                WHERE user_id = @userId AND contact_type = @contactType AND is_primary;
            """;
            clearPrimaryCmd.Parameters.AddWithValue("userId", userId);
            clearPrimaryCmd.Parameters.AddWithValue("contactType", contactType);
            await clearPrimaryCmd.ExecuteNonQueryAsync();
        }

        await using var insertCmd = connection.CreateCommand();
        insertCmd.Transaction = transaction;
        insertCmd.CommandText = """
            INSERT INTO user_contacts (user_id, contact_type, contact_value, label, is_primary)
            VALUES (@userId, @contactType, @contactValue, @label, @isPrimary)
            RETURNING *;
        """;
        insertCmd.Parameters.AddWithValue("userId", userId);
        insertCmd.Parameters.AddWithValue("contactType", contactType);
        insertCmd.Parameters.AddWithValue("contactValue", contactValue);
        insertCmd.Parameters.AddWithValue("label", (object?)label ?? DBNull.Value);
        insertCmd.Parameters.AddWithValue("isPrimary", isPrimary);

        await using var reader = await insertCmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var created = Map(reader);
        await reader.CloseAsync();

        await transaction.CommitAsync();
        return created;
    }
}
