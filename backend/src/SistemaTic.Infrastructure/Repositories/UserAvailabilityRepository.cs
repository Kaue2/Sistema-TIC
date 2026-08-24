using Npgsql;
using NpgsqlTypes;
using SistemaTic.Application.Contracts;
using SistemaTic.Application.DTO;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class UserAvailabilityRepository : IUserAvailabilityRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public UserAvailabilityRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static UserAvailability Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        Guid userId = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
        short weekday = reader.IsDBNull(2) ? (short)0 : reader.GetInt16(2);
        TimeOnly startsAt = reader.IsDBNull(3) ? TimeOnly.MinValue : reader.GetFieldValue<TimeOnly>(3);
        TimeOnly endsAt = reader.IsDBNull(4) ? TimeOnly.MinValue : reader.GetFieldValue<TimeOnly>(4);
        string timezone = reader.IsDBNull(5) ? string.Empty : reader.GetString(5);
        DateOnly? validFrom = reader.IsDBNull(6) ? null : reader.GetFieldValue<DateOnly>(6);
        DateOnly? validUntil = reader.IsDBNull(7) ? null : reader.GetFieldValue<DateOnly>(7);
        string? notes = reader.IsDBNull(8) ? null : reader.GetString(8);
        DateTimeOffset createdAt = reader.IsDBNull(9) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(9);
        DateTimeOffset updatedAt = reader.IsDBNull(10) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(10);

        return new UserAvailability(
            id,
            userId,
            weekday,
            startsAt,
            endsAt,
            timezone,
            validFrom,
            validUntil,
            notes,
            createdAt,
            updatedAt
        );
    }

    public async Task<IEnumerable<UserAvailability>> GetByUserIdAsync(Guid userId)
    {
        List<UserAvailability> items = new List<UserAvailability>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM user_availability WHERE user_id = @userId ORDER BY weekday, starts_at");
        cmd.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            items.Add(Map(reader));
        }
        return items;
    }

    public async Task<UserAvailability> CreateAsync(Guid userId, short weekday, TimeOnly startsAt, TimeOnly endsAt)
    {
        // não manda "timezone": a coluna já tem default 'America/Sao_Paulo' no banco
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO user_availability (user_id, weekday, starts_at, ends_at)
            VALUES (@userId, @weekday, @startsAt, @endsAt)
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("weekday", weekday);
        cmd.Parameters.Add(new NpgsqlParameter("startsAt", NpgsqlDbType.Time) { Value = startsAt });
        cmd.Parameters.Add(new NpgsqlParameter("endsAt", NpgsqlDbType.Time) { Value = endsAt });

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return Map(reader);
    }

    public async Task<UserAvailability?> UpdateAsync(Guid id, UserAvailabilityDTO dto)
    {
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            UPDATE user_availability
            SET weekday = @weekday,
                starts_at = @startsAt,
                ends_at = @endsAt,
                timezone = COALESCE(@timezone, timezone),
                valid_from = @validFrom,
                valid_until = @validUntil,
                notes = @notes
            WHERE id = @id
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("weekday", dto.Weekday);
        cmd.Parameters.Add(new NpgsqlParameter("startsAt", NpgsqlDbType.Time) { Value = dto.StartsAt });
        cmd.Parameters.Add(new NpgsqlParameter("endsAt", NpgsqlDbType.Time) { Value = dto.EndsAt });
        cmd.Parameters.AddWithValue("timezone", (object?)dto.Timezone ?? DBNull.Value);
        cmd.Parameters.AddWithValue("validFrom", (object?)dto.ValidFrom ?? DBNull.Value);
        cmd.Parameters.AddWithValue("validUntil", (object?)dto.ValidUntil ?? DBNull.Value);
        cmd.Parameters.AddWithValue("notes", (object?)dto.Notes ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }
        return null;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        await using var cmd = _dataSource.CreateCommand("DELETE FROM user_availability WHERE id = @id");
        cmd.Parameters.AddWithValue("id", id);
        int affected = await cmd.ExecuteNonQueryAsync();
        return affected > 0;
    }
}
