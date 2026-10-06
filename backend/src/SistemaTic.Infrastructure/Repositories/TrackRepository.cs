using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class TrackRepository : ITrackRepository
{
    private readonly NpgsqlDataSource _dataSource;
    private readonly ICurrentUser _currentUser;
    public TrackRepository(NpgsqlDataSource dataSource, ICurrentUser currentUser)
    {
        this._dataSource = dataSource;
        this._currentUser = currentUser;
    }

    private static Track Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        Guid? ideaId = reader.IsDBNull(1) ? null : reader.GetGuid(1);
        Guid? sourceTrackId = reader.IsDBNull(2) ? null : reader.GetGuid(2);
        Guid knowledgeAreaId = reader.IsDBNull(3) ? Guid.Empty : reader.GetGuid(3);
        Guid? categoryId = reader.IsDBNull(4) ? null : reader.GetGuid(4);
        string title = reader.IsDBNull(5) ? string.Empty : reader.GetString(5);
        string? shortDescription = reader.IsDBNull(6) ? null : reader.GetString(6);
        string modality = reader.IsDBNull(7) ? string.Empty : reader.GetString(7);
        string? learningLevel = reader.IsDBNull(8) ? null : reader.GetString(8);
        string status = reader.IsDBNull(9) ? string.Empty : reader.GetString(9);
        DateOnly? plannedProductionStartsOn = reader.IsDBNull(10) ? null : reader.GetFieldValue<DateOnly>(10);
        DateOnly? plannedProductionEndsOn = reader.IsDBNull(11) ? null : reader.GetFieldValue<DateOnly>(11);
        DateOnly? plannedTrackStartsOn = reader.IsDBNull(12) ? null : reader.GetFieldValue<DateOnly>(12);
        DateOnly? plannedTrackEndsOn = reader.IsDBNull(13) ? null : reader.GetFieldValue<DateOnly>(13);
        DateTimeOffset? registrationStartsAt = reader.IsDBNull(14) ? null : reader.GetFieldValue<DateTimeOffset>(14);
        DateTimeOffset? registrationEndsAt = reader.IsDBNull(15) ? null : reader.GetFieldValue<DateTimeOffset>(15);
        int onlineWorkloadMinutes = reader.IsDBNull(16) ? 0 : reader.GetInt32(16);
        int inPersonWorkloadMinutes = reader.IsDBNull(17) ? 0 : reader.GetInt32(17);
        int totalWorkloadMinutes = reader.IsDBNull(18) ? 0 : reader.GetInt32(18);
        int? plannedCapacity = reader.IsDBNull(19) ? null : reader.GetInt32(19);
        string? targetAudience = reader.IsDBNull(20) ? null : reader.GetString(20);
        string? prerequisites = reader.IsDBNull(21) ? null : reader.GetString(21);
        decimal? attendanceRequirementPercent = reader.IsDBNull(22) ? null : reader.GetDecimal(22);
        Guid createdByUserId = reader.IsDBNull(23) ? Guid.Empty : reader.GetGuid(23);
        DateTimeOffset createdAt = reader.IsDBNull(24) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(24);
        DateTimeOffset updatedAt = reader.IsDBNull(25) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(25);
        DateTimeOffset? cancelledAt = reader.IsDBNull(26) ? null : reader.GetFieldValue<DateTimeOffset>(26);
        int codeOrdinal = reader.GetOrdinal("code");
        int code = reader.IsDBNull(codeOrdinal) ? 0 : reader.GetInt32(codeOrdinal);

        int legacyCodeOrdinal = reader.GetOrdinal("legacy_code");
        string? legacyCode = reader.IsDBNull(legacyCodeOrdinal)
            ? null
            : reader.GetString(legacyCodeOrdinal);

        int semesterOrdinal = reader.GetOrdinal("semester");
        string semester = reader.IsDBNull(semesterOrdinal)
            ? string.Empty
            : reader.GetString(semesterOrdinal);

        return new Track(id, code, legacyCode, ideaId, sourceTrackId, knowledgeAreaId, categoryId, title,
                          shortDescription, modality, learningLevel, status, plannedProductionStartsOn,
                          plannedProductionEndsOn, plannedTrackStartsOn, plannedTrackEndsOn,
                          registrationStartsAt, registrationEndsAt, onlineWorkloadMinutes,
                          inPersonWorkloadMinutes, totalWorkloadMinutes, plannedCapacity, targetAudience,
                          prerequisites, attendanceRequirementPercent, createdByUserId, createdAt,
                          updatedAt, cancelledAt, semester);
    }

    public async Task<Track?> GetByIdAsync(Guid id)
    {
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM tracks WHERE id = @id");
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }
        return null;
    }

    public async Task<IEnumerable<Track>> GetAllAsync()
    {
        List<Track> tracks = new List<Track>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM tracks ORDER BY created_at DESC");

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tracks.Add(Map(reader));
        }
        return tracks;
    }

    public async Task<Track> CreateAsync(
        Guid? ideaId,
        Guid? sourceTrackId,
        Guid knowledgeAreaId,
        Guid? categoryId,
        string title,
        string semester,
        string? shortDescription,
        string modality,
        string? learningLevel,
        DateOnly? plannedProductionStartsOn,
        DateOnly? plannedProductionEndsOn,
        DateOnly? plannedTrackStartsOn,
        DateOnly? plannedTrackEndsOn,
        DateTimeOffset? registrationStartsAt,
        DateTimeOffset? registrationEndsAt,
        int onlineWorkloadMinutes,
        int inPersonWorkloadMinutes,
        int? plannedCapacity,
        string? targetAudience,
        string? prerequisites,
        decimal? attendanceRequirementPercent,
        Guid createdByUserId,
        IReadOnlyCollection<PublishedDocumentTemplate> documentTemplates)
    {
        // Trilha, coordenador responsável e documentos nascem na mesma transação:
        // se qualquer insert falhar, nada fica gravado.
        await using var connection = await this._dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsActorAsync(this._currentUser.Id);

        // code não entra no insert: é gerado automaticamente pelo banco (GENERATED ALWAYS AS IDENTITY)
        await using var cmd = connection.CreateCommand();
        cmd.Transaction = transaction;
        cmd.CommandText = """
            INSERT INTO tracks (
                idea_id, source_track_id, knowledge_area_id, category_id, title, semester, short_description,
                modality, learning_level, planned_production_starts_on, planned_production_ends_on,
                planned_track_starts_on, planned_track_ends_on, registration_starts_at, registration_ends_at,
                online_workload_minutes, in_person_workload_minutes, planned_capacity, target_audience,
                prerequisites, attendance_requirement_percent, created_by_user_id
            )
            VALUES (
                @ideaId, @sourceTrackId, @knowledgeAreaId, @categoryId, @title, @semester, @shortDescription,
                @modality, @learningLevel, @plannedProductionStartsOn, @plannedProductionEndsOn,
                @plannedTrackStartsOn, @plannedTrackEndsOn, @registrationStartsAt, @registrationEndsAt,
                @onlineWorkloadMinutes, @inPersonWorkloadMinutes, @plannedCapacity, @targetAudience,
                @prerequisites, @attendanceRequirementPercent, @createdByUserId
            )
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("ideaId", (object?)ideaId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("sourceTrackId", (object?)sourceTrackId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("knowledgeAreaId", knowledgeAreaId);
        cmd.Parameters.AddWithValue("categoryId", (object?)categoryId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("title", title);
        cmd.Parameters.AddWithValue("semester", semester);
        cmd.Parameters.AddWithValue("shortDescription", (object?)shortDescription ?? DBNull.Value);
        cmd.Parameters.AddWithValue("modality", modality);
        cmd.Parameters.AddWithValue("learningLevel", (object?)learningLevel ?? DBNull.Value);
        cmd.Parameters.AddWithValue("plannedProductionStartsOn", (object?)plannedProductionStartsOn ?? DBNull.Value);
        cmd.Parameters.AddWithValue("plannedProductionEndsOn", (object?)plannedProductionEndsOn ?? DBNull.Value);
        cmd.Parameters.AddWithValue("plannedTrackStartsOn", (object?)plannedTrackStartsOn ?? DBNull.Value);
        cmd.Parameters.AddWithValue("plannedTrackEndsOn", (object?)plannedTrackEndsOn ?? DBNull.Value);
        cmd.Parameters.AddWithValue("registrationStartsAt", (object?)registrationStartsAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("registrationEndsAt", (object?)registrationEndsAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("onlineWorkloadMinutes", onlineWorkloadMinutes);
        cmd.Parameters.AddWithValue("inPersonWorkloadMinutes", inPersonWorkloadMinutes);
        cmd.Parameters.AddWithValue("plannedCapacity", (object?)plannedCapacity ?? DBNull.Value);
        cmd.Parameters.AddWithValue("targetAudience", (object?)targetAudience ?? DBNull.Value);
        cmd.Parameters.AddWithValue("prerequisites", (object?)prerequisites ?? DBNull.Value);
        cmd.Parameters.AddWithValue("attendanceRequirementPercent", (object?)attendanceRequirementPercent ?? DBNull.Value);
        cmd.Parameters.AddWithValue("createdByUserId", createdByUserId);

        Track track;
        await using (var reader = await cmd.ExecuteReaderAsync())
        {
            await reader.ReadAsync();
            track = Map(reader);
        }

        await using (var memberCmd = connection.CreateCommand())
        {
            memberCmd.Transaction = transaction;
            memberCmd.CommandText = """
                INSERT INTO track_team_members (track_id, user_id, responsibility, is_lead, assigned_by_user_id)
                VALUES (@trackId, @userId, 'coordinator', true, @userId);
            """;
            memberCmd.Parameters.AddWithValue("trackId", track.Id);
            memberCmd.Parameters.AddWithValue("userId", createdByUserId);
            await memberCmd.ExecuteNonQueryAsync();
        }

        foreach (var template in documentTemplates)
        {
            // current_content/current_revision_number/status ficam de fora: o banco já tem default pra eles
            await using var documentCmd = connection.CreateCommand();
            documentCmd.Transaction = transaction;
            documentCmd.CommandText = """
                INSERT INTO track_documents (track_id, document_template_id, template_version_id, created_by_user_id, updated_by_user_id)
                VALUES (@trackId, @documentTemplateId, @templateVersionId, @userId, @userId);
            """;
            documentCmd.Parameters.AddWithValue("trackId", track.Id);
            documentCmd.Parameters.AddWithValue("documentTemplateId", template.DocumentTemplateId);
            documentCmd.Parameters.AddWithValue("templateVersionId", template.TemplateVersionId);
            documentCmd.Parameters.AddWithValue("userId", createdByUserId);
            await documentCmd.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();
        return track;
    }

    public async Task<Track> DuplicateAsync(Guid sourceTrackId, Guid createdByUserId)
    {
        // Trilha, equipe, documentos e respostas do Softex da cópia nascem na mesma transação:
        // se qualquer insert falhar, nada fica gravado.
        await using var connection = await this._dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsActorAsync(this._currentUser.Id);

        // id e code são gerados pelo banco; idea_id fica de fora (é UNIQUE e a cópia não nasce de
        // uma ideia). status, created_at e updated_at usam o default (status = 'draft').
        Track track;
        await using (var cmd = connection.CreateCommand())
        {
            cmd.Transaction = transaction;
            cmd.CommandText = """
                INSERT INTO tracks (
                    source_track_id, knowledge_area_id, category_id, title, semester, short_description,
                    modality, learning_level, planned_production_starts_on, planned_production_ends_on,
                    planned_track_starts_on, planned_track_ends_on, registration_starts_at, registration_ends_at,
                    online_workload_minutes, in_person_workload_minutes, planned_capacity, target_audience,
                    prerequisites, attendance_requirement_percent, created_by_user_id
                )
                SELECT id, knowledge_area_id, category_id, title, semester, short_description,
                       modality, learning_level, planned_production_starts_on, planned_production_ends_on,
                       planned_track_starts_on, planned_track_ends_on, registration_starts_at, registration_ends_at,
                       online_workload_minutes, in_person_workload_minutes, planned_capacity, target_audience,
                       prerequisites, attendance_requirement_percent, @createdByUserId
                  FROM tracks
                 WHERE id = @sourceTrackId
                RETURNING *;
            """;
            cmd.Parameters.AddWithValue("sourceTrackId", sourceTrackId);
            cmd.Parameters.AddWithValue("createdByUserId", createdByUserId);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
                throw new KeyNotFoundException("Trilha não encontrada");
            track = Map(reader);
        }

        // só a equipe ativa é copiada (ends_on IS NULL), com as mesmas responsabilidades
        await using (var memberCmd = connection.CreateCommand())
        {
            memberCmd.Transaction = transaction;
            memberCmd.CommandText = """
                INSERT INTO track_team_members (track_id, user_id, responsibility, is_lead, assigned_by_user_id)
                SELECT @trackId, user_id, responsibility, is_lead, @userId
                  FROM track_team_members
                 WHERE track_id = @sourceTrackId AND ends_on IS NULL;
            """;
            memberCmd.Parameters.AddWithValue("trackId", track.Id);
            memberCmd.Parameters.AddWithValue("sourceTrackId", sourceTrackId);
            memberCmd.Parameters.AddWithValue("userId", createdByUserId);
            await memberCmd.ExecuteNonQueryAsync();
        }

        // Documentos levam o conteúdo atual e voltam a 'draft' (default). Revisões, comentários de
        // revisão e SharePoint são histórico/vínculo da trilha original e não são copiados.
        await using (var documentCmd = connection.CreateCommand())
        {
            documentCmd.Transaction = transaction;
            documentCmd.CommandText = """
                INSERT INTO track_documents (
                    track_id, document_template_id, template_version_id, current_content,
                    created_by_user_id, updated_by_user_id
                )
                SELECT @trackId, document_template_id, template_version_id, current_content, @userId, @userId
                  FROM track_documents
                 WHERE track_id = @sourceTrackId;
            """;
            documentCmd.Parameters.AddWithValue("trackId", track.Id);
            documentCmd.Parameters.AddWithValue("sourceTrackId", sourceTrackId);
            documentCmd.Parameters.AddWithValue("userId", createdByUserId);
            await documentCmd.ExecuteNonQueryAsync();
        }

        // O relatório Softex é exportado a partir de report_answers (sincronizada com o conteúdo a
        // cada save), então as respostas acompanham o documento copiado.
        await using (var answerCmd = connection.CreateCommand())
        {
            answerCmd.Transaction = transaction;
            answerCmd.CommandText = """
                INSERT INTO report_answers (
                    track_document_id, report_question_id, answer, created_by_user_id, updated_by_user_id
                )
                SELECT copied.id, answer.report_question_id, answer.answer, @userId, @userId
                  FROM report_answers answer
                  JOIN track_documents original ON original.id = answer.track_document_id
                  JOIN track_documents copied
                    ON copied.track_id = @trackId
                   AND copied.document_template_id = original.document_template_id
                 WHERE original.track_id = @sourceTrackId;
            """;
            answerCmd.Parameters.AddWithValue("trackId", track.Id);
            answerCmd.Parameters.AddWithValue("sourceTrackId", sourceTrackId);
            answerCmd.Parameters.AddWithValue("userId", createdByUserId);
            await answerCmd.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();
        return track;
    }
}
