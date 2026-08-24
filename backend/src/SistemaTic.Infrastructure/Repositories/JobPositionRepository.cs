using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class JobPositionRepository : IJobPositionRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public JobPositionRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static JobPosition Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        string code = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
        string name = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
        string? description = reader.IsDBNull(3) ? null : reader.GetString(3);
        bool isActive = reader.IsDBNull(4) ? false : reader.GetBoolean(4);
        DateTimeOffset createdAt = reader.IsDBNull(5) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(5);
        DateTimeOffset updatedAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);

        return new JobPosition(id, code, name, description, isActive, createdAt, updatedAt);
    }

    public async Task<IEnumerable<JobPosition>> GetActiveAsync()
    {
        List<JobPosition> positions = new List<JobPosition>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM job_positions WHERE is_active ORDER BY name");
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            positions.Add(Map(reader));
        }
        return positions;
    }
}
