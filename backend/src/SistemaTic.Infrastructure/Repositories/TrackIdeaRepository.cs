using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class TrackIdeaRepository : ITrackIdeaRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public TrackIdeaRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static TrackIdea Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        string title = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
        string description = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
        Guid? suggestedKnowledgeAreaId = reader.IsDBNull(3) ? null : reader.GetGuid(3);
        Guid? proposedByUserId = reader.IsDBNull(4) ? null : reader.GetGuid(4);
        string? proposerName = reader.IsDBNull(5) ? null : reader.GetString(5);
        string? proposerContact = reader.IsDBNull(6) ? null : reader.GetString(6);
        string status = reader.IsDBNull(7) ? string.Empty : reader.GetString(7);
        Guid? reviewedByUserId = reader.IsDBNull(8) ? null : reader.GetGuid(8);
        DateTimeOffset? reviewedAt = reader.IsDBNull(9) ? null : reader.GetFieldValue<DateTimeOffset>(9);
        string? reviewNotes = reader.IsDBNull(10) ? null : reader.GetString(10);
        DateTimeOffset createdAt = reader.IsDBNull(11) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(11);
        DateTimeOffset updatedAt = reader.IsDBNull(12) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(12);

        return new TrackIdea(id, title, description, suggestedKnowledgeAreaId, proposedByUserId,
                              proposerName, proposerContact, status, reviewedByUserId, reviewedAt,
                              reviewNotes, createdAt, updatedAt);
    }

    public async Task<TrackIdea?> GetByIdAsync(Guid id)
    {
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM track_ideas WHERE id = @id");
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }
        return null;
    }

    public async Task<TrackIdea> CreateAsync(
        string title,
        string description,
        Guid? suggestedKnowledgeAreaId,
        Guid? proposedByUserId,
        string? proposerName,
        string? proposerContact)
    {
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO track_ideas (title, description, suggested_knowledge_area_id, proposed_by_user_id, proposer_name, proposer_contact)
            VALUES (@title, @description, @suggestedKnowledgeAreaId, @proposedByUserId, @proposerName, @proposerContact)
            RETURNING *;
        """;
        cmd.Parameters.AddWithValue("title", title);
        cmd.Parameters.AddWithValue("description", description);
        cmd.Parameters.AddWithValue("suggestedKnowledgeAreaId", (object?)suggestedKnowledgeAreaId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("proposedByUserId", (object?)proposedByUserId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("proposerName", (object?)proposerName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("proposerContact", (object?)proposerContact ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return Map(reader);
    }
}
