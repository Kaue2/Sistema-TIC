using Npgsql;
using NpgsqlTypes;
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

    public async Task<TrackDocument?> GetByIdAsync(Guid id)
    {
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM track_documents WHERE id = @id");
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        return Map(reader);
    }

    public async Task<TrackDocument> ReplaceContentAsync(Guid trackDocumentId, string newContent, Guid changedByUserId)
    {
        await using var connection = await _dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        // 1. Trava a linha do documento até o fim da transação, pra dois saves concorrentes
        //    não se pisarem (equivalente ao "SELECT ... FOR UPDATE" da function que ela substitui).
        TrackDocument current;
        await using (var selectCmd = new NpgsqlCommand(
            "SELECT * FROM track_documents WHERE id = @id FOR UPDATE", connection, transaction))
        {
            selectCmd.Parameters.AddWithValue("id", trackDocumentId);
            await using var reader = await selectCmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
                throw new Exception("Documento não encontrado");
            current = Map(reader);
        }

        if (current.Status is "approved" or "rejected")
            throw new Exception("Documentos aprovados ou reprovados não podem ser editados");

        // 2. Reaproveita a revisão em rascunho já aberta ou cria uma nova (numeração sequencial por documento).
        Guid? draftRevisionId;
        await using (var findDraftCmd = new NpgsqlCommand(
            "SELECT id FROM document_revisions WHERE track_document_id = @id AND status = 'draft'", connection, transaction))
        {
            findDraftCmd.Parameters.AddWithValue("id", trackDocumentId);
            draftRevisionId = (Guid?)await findDraftCmd.ExecuteScalarAsync();
        }

        if (draftRevisionId is null)
        {
            await using var nextRevisionCmd = new NpgsqlCommand(
                "SELECT COALESCE(max(revision_number), 0) + 1 FROM document_revisions WHERE track_document_id = @id",
                connection, transaction);
            nextRevisionCmd.Parameters.AddWithValue("id", trackDocumentId);
            int nextRevisionNumber = (int)(await nextRevisionCmd.ExecuteScalarAsync())!;

            await using var insertRevisionCmd = new NpgsqlCommand("""
                INSERT INTO document_revisions (track_document_id, revision_number, created_by_user_id)
                VALUES (@trackDocumentId, @revisionNumber, @createdByUserId)
                RETURNING id;
            """, connection, transaction);
            insertRevisionCmd.Parameters.AddWithValue("trackDocumentId", trackDocumentId);
            insertRevisionCmd.Parameters.AddWithValue("revisionNumber", nextRevisionNumber);
            insertRevisionCmd.Parameters.AddWithValue("createdByUserId", changedByUserId);
            draftRevisionId = (Guid)(await insertRevisionCmd.ExecuteScalarAsync())!;
        }

        // 3. Grava 1 registro de auditoria com o conteúdo antigo e o novo (troca o documento inteiro,
        //    não campo a campo).
        await using (var nextChangeOrderCmd = new NpgsqlCommand(
            "SELECT COALESCE(max(change_order), 0) + 1 FROM document_revision_changes WHERE document_revision_id = @revisionId",
            connection, transaction))
        {
            nextChangeOrderCmd.Parameters.AddWithValue("revisionId", draftRevisionId.Value);
            int nextChangeOrder = (int)(await nextChangeOrderCmd.ExecuteScalarAsync())!;

            await using var insertChangeCmd = new NpgsqlCommand("""
                INSERT INTO document_revision_changes (
                    document_revision_id, change_order, field_path, operation, old_value, new_value, changed_by_user_id
                ) VALUES (@revisionId, @changeOrder, 'content', 'replace', @oldValue, @newValue, @changedByUserId);
            """, connection, transaction);
            insertChangeCmd.Parameters.AddWithValue("revisionId", draftRevisionId.Value);
            insertChangeCmd.Parameters.AddWithValue("changeOrder", nextChangeOrder);
            insertChangeCmd.Parameters.Add(new NpgsqlParameter("oldValue", NpgsqlDbType.Jsonb) { Value = current.CurrentContent });
            insertChangeCmd.Parameters.Add(new NpgsqlParameter("newValue", NpgsqlDbType.Jsonb) { Value = newContent });
            insertChangeCmd.Parameters.AddWithValue("changedByUserId", changedByUserId);
            await insertChangeCmd.ExecuteNonQueryAsync();
        }

        // 4. Aplica a mudança de fato e volta o documento pro status "draft".
        TrackDocument updated;
        await using (var updateCmd = new NpgsqlCommand("""
            UPDATE track_documents
               SET current_content = @newContent,
                   status = 'draft',
                   updated_by_user_id = @changedByUserId,
                   submitted_at = NULL,
                   approved_at = NULL
             WHERE id = @id
            RETURNING *;
        """, connection, transaction))
        {
            updateCmd.Parameters.Add(new NpgsqlParameter("newContent", NpgsqlDbType.Jsonb) { Value = newContent });
            updateCmd.Parameters.AddWithValue("changedByUserId", changedByUserId);
            updateCmd.Parameters.AddWithValue("id", trackDocumentId);
            await using var reader = await updateCmd.ExecuteReaderAsync();
            await reader.ReadAsync();
            updated = Map(reader);
        }

        await transaction.CommitAsync();
        return updated;
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
