using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class KnowledgeAreaRepository : IKnowledgeAreaRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public KnowledgeAreaRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    public async Task<IEnumerable<KnowledgeArea>> GetActiveAsync()
    {
        List<KnowledgeArea> areas = new List<KnowledgeArea>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM knowledge_areas WHERE is_active ORDER BY name");
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
            string code = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
            string name = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
            string? description = reader.IsDBNull(3) ? null : reader.GetString(3);
            bool isActive = reader.IsDBNull(4) ? false : reader.GetBoolean(4);
            DateTimeOffset createdAt = reader.IsDBNull(5) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(5);
            DateTimeOffset updatedAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);

            areas.Add(new KnowledgeArea(id, code, name, description, isActive, createdAt, updatedAt));
        }
        return areas;
    }

    public async Task<KnowledgeArea?> GetByIdAsync(Guid id)
    {
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM knowledge_areas WHERE id = @id");
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        Guid areaId = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        string code = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
        string name = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
        string? description = reader.IsDBNull(3) ? null : reader.GetString(3);
        bool isActive = reader.IsDBNull(4) ? false : reader.GetBoolean(4);
        DateTimeOffset createdAt = reader.IsDBNull(5) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(5);
        DateTimeOffset updatedAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);

        return new KnowledgeArea(areaId, code, name, description, isActive, createdAt, updatedAt);
    }
}
