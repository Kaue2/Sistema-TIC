using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public RoleRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static Roles Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        string code = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
        string name = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
        short hierarchyLevel = reader.IsDBNull(3) ? (short)0 : reader.GetInt16(3);
        string? description = reader.IsDBNull(4) ? null : reader.GetString(4);
        bool isActive = reader.IsDBNull(5) ? false : reader.GetBoolean(5);
        DateTimeOffset createdAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);

        return new Roles(id, code, name, hierarchyLevel, description, isActive, createdAt);
    }

    public async Task<IEnumerable<Roles>> GetAllAsync()
    {
        List<Roles> roles = new List<Roles>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM roles ORDER BY hierarchy_level DESC");
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            roles.Add(Map(reader));
        }
        return roles;
    }

    public async Task<Roles?> GetByCodeAsync(string code)
    {
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM roles WHERE code = @code");
        cmd.Parameters.AddWithValue("code", code);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }
        return null;
    }
}
