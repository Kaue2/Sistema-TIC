using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class TrackDocumentRepository : ITrackDocumentRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public TrackDocumentRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static TrackDocument Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        Guid trackId = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
        Guid documentTemplateId = reader.IsDBNull(2) ? Guid.Empty : reader.GetGuid(2);
        Guid templateVersionId = reader.IsDBNull(3) ? Guid.Empty : reader.GetGuid(3);
        string currentContent = reader.IsDBNull(4) ? "{}" : reader.GetString(4);
        int currentRevisionNumber = reader.IsDBNull(5) ? 0 : reader.GetInt32(5);
        string status = reader.IsDBNull(6) ? string.Empty : reader.GetString(6);
        string? sharepointUrl = reader.IsDBNull(7) ? null : reader.GetString(7);
        string? sharepointItemId = reader.IsDBNull(8) ? null : reader.GetString(8);
        Guid createdByUserId = reader.IsDBNull(9) ? Guid.Empty : reader.GetGuid(9);
        Guid updatedByUserId = reader.IsDBNull(10) ? Guid.Empty : reader.GetGuid(10);
        DateTimeOffset? submittedAt = reader.IsDBNull(11) ? null : reader.GetFieldValue<DateTimeOffset>(11);
        DateTimeOffset? approvedAt = reader.IsDBNull(12) ? null : reader.GetFieldValue<DateTimeOffset>(12);
        DateTimeOffset createdAt = reader.IsDBNull(13) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(13);
        DateTimeOffset updatedAt = reader.IsDBNull(14) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(14);

        return new TrackDocument(id, trackId, documentTemplateId, templateVersionId, currentContent,
                                  currentRevisionNumber, status, sharepointUrl, sharepointItemId,
                                  createdByUserId, updatedByUserId, submittedAt, approvedAt, createdAt,
                                  updatedAt);
    }

    public async Task<IEnumerable<TrackDocument>> GetByTrackIdAsync(Guid trackId)
    {
        List<TrackDocument> documents = new List<TrackDocument>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM track_documents WHERE track_id = @trackId");
        cmd.Parameters.AddWithValue("trackId", trackId);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            documents.Add(Map(reader));
        }
        return documents;
    }

    public async Task<TrackDocument> CreateAsync(
        Guid trackId,
        Guid documentTemplateId,
        Guid templateVersionId,
        Guid createdByUserId,
        Guid updatedByUserId)
    {
        // current_content/current_revision_number/status ficam de fora: o banco já tem default pra eles
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO track_documents (track_id, document_template_id, template_version_id, created_by_user_id, updated_by_user_id)
            VALUES (@trackId, @documentTemplateId, @templateVersionId, @createdByUserId, @updatedByUserId)
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("trackId", trackId);
        cmd.Parameters.AddWithValue("documentTemplateId", documentTemplateId);
        cmd.Parameters.AddWithValue("templateVersionId", templateVersionId);
        cmd.Parameters.AddWithValue("createdByUserId", createdByUserId);
        cmd.Parameters.AddWithValue("updatedByUserId", updatedByUserId);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return Map(reader);
    }
}
