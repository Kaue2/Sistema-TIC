using Npgsql;
using System.Text.Json;
using SistemaTic.Application.Contracts;
using SistemaTic.Application.DTO;
using SistemaTic.Application.Services;

namespace SistemaTic.Infrastructure.Repositories;

public class ReportAttachmentRepository : IReportAttachmentRepository
{
    private const string SoftexTemplateCode = "softex_accountability_report";
    private readonly NpgsqlDataSource _dataSource;

    public ReportAttachmentRepository(NpgsqlDataSource dataSource)
    {
        _dataSource = dataSource;
    }

    public async Task<AttachmentStageDTO?> GetStageAsync(
        Guid documentId,
        string stageCode,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);

        Guid stageId;
        string resolvedStageCode;
        string stageName;
        bool isEditable;
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                SELECT rs.id, rs.code, rs.name,
                       td.status IN ('draft', 'changes_requested') AS is_editable
                  FROM track_documents td
                  JOIN document_templates dt ON dt.id = td.document_template_id
                  JOIN report_stages rs ON rs.code = @stageCode AND rs.is_active
                 WHERE td.id = @documentId
                   AND dt.code = @templateCode;
                """;
            command.Parameters.AddWithValue("documentId", documentId);
            command.Parameters.AddWithValue("stageCode", stageCode);
            command.Parameters.AddWithValue("templateCode", SoftexTemplateCode);

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken)) return null;
            stageId = reader.GetGuid(0);
            resolvedStageCode = reader.GetString(1);
            stageName = reader.GetString(2);
            isEditable = reader.GetBoolean(3);
        }

        var typeBuilders = new Dictionary<Guid, TypeBuilder>();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                SELECT at.id, at.code, at.name, at.description,
                       rq.id, rq.code, rq.label, qat.notes
                  FROM report_questions rq
                  JOIN question_attachment_types qat ON qat.report_question_id = rq.id
                  JOIN attachment_types at ON at.id = qat.attachment_type_id AND at.is_active
                 WHERE rq.report_stage_id = @stageId
                   AND rq.is_active
                 ORDER BY qat.display_order, at.name, rq.display_order;
                """;
            command.Parameters.AddWithValue("stageId", stageId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                var typeId = reader.GetGuid(0);
                if (!typeBuilders.TryGetValue(typeId, out var builder))
                {
                    builder = new TypeBuilder(
                        typeId,
                        reader.GetString(1),
                        reader.GetString(2),
                        reader.IsDBNull(3) ? null : reader.GetString(3));
                    typeBuilders.Add(typeId, builder);
                }

                builder.Questions.Add(new AttachmentQuestionDTO(
                    reader.GetGuid(4),
                    reader.GetString(5),
                    reader.GetString(6),
                    reader.IsDBNull(7) ? null : reader.GetString(7)));
            }
        }

        var annexBuilders = new Dictionary<Guid, AnnexBuilder>();
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                SELECT ra.id, ra.attachment_type_id, ra.title, ra.source_reference,
                       ra.validation_status, ra.validation_notes, ra.version, ra.created_at,
                       COALESCE(
                           array_agg(rq.code ORDER BY rq.display_order)
                               FILTER (WHERE rq.id IS NOT NULL),
                           ARRAY[]::text[]
                       ) AS question_codes
                  FROM report_annexes ra
                  LEFT JOIN question_annexes qa ON qa.report_annex_id = ra.id
                  LEFT JOIN report_questions rq ON rq.id = qa.report_question_id
                 WHERE ra.track_document_id = @documentId
                   AND ra.report_stage_id = @stageId
                   AND ra.deleted_at IS NULL
                 GROUP BY ra.id
                 ORDER BY ra.created_at, ra.id;
                """;
            command.Parameters.AddWithValue("documentId", documentId);
            command.Parameters.AddWithValue("stageId", stageId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                var annexId = reader.GetGuid(0);
                var typeId = reader.GetGuid(1);
                var builder = new AnnexBuilder(
                    annexId,
                    reader.GetString(2),
                    reader.IsDBNull(3) ? null : reader.GetString(3),
                    reader.GetString(4),
                    reader.IsDBNull(5) ? null : reader.GetString(5),
                    reader.GetInt32(6),
                    reader.GetFieldValue<DateTimeOffset>(7),
                    reader.GetFieldValue<string[]>(8));
                annexBuilders.Add(annexId, builder);
                if (typeBuilders.TryGetValue(typeId, out var typeBuilder))
                    typeBuilder.Annexes.Add(builder);
            }
        }

        if (annexBuilders.Count > 0)
        {
            await using var command = connection.CreateCommand();
            command.CommandText = """
                SELECT rai.id, rai.report_annex_id, fa.original_file_name,
                       COALESCE(fa.media_type, 'application/octet-stream'),
                       COALESCE(fa.size_bytes, 0), rai.display_order, rai.caption
                  FROM report_annex_images rai
                  JOIN file_assets fa ON fa.id = rai.file_asset_id
                 WHERE rai.report_annex_id = ANY(@annexIds)
                   AND rai.deleted_at IS NULL
                   AND fa.deleted_at IS NULL
                 ORDER BY rai.report_annex_id, rai.display_order;
                """;
            command.Parameters.AddWithValue("annexIds", annexBuilders.Keys.ToArray());
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                var imageId = reader.GetGuid(0);
                var annexId = reader.GetGuid(1);
                annexBuilders[annexId].Images.Add(new AttachmentImageDTO(
                    imageId,
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.GetInt64(4),
                    reader.GetInt32(5),
                    reader.IsDBNull(6) ? null : reader.GetString(6),
                    $"/api/documents/{documentId}/attachments/images/{imageId}/content"));
            }
        }

        var types = typeBuilders.Values
            .Select(builder => builder.Build())
            .ToArray();
        return new AttachmentStageDTO(stageId, resolvedStageCode, stageName, isEditable, types);
    }

    public async Task<Guid> CreateAnnexAsync(
        Guid documentId,
        string stageCode,
        string attachmentTypeCode,
        string title,
        string? sourceReference,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await SetActorAsync(connection, transaction, userId, cancellationToken);

        var annexId = Guid.NewGuid();
        await using (var command = connection.CreateCommand())
        {
            command.Transaction = transaction;
            command.CommandText = """
                INSERT INTO report_annexes (
                    id, track_document_id, report_stage_id, attachment_type_id,
                    title, source_reference, created_by_user_id
                )
                SELECT @annexId, td.id, rs.id, at.id, @title, @sourceReference, @userId
                  FROM track_documents td
                  JOIN document_templates dt ON dt.id = td.document_template_id
                  JOIN report_stages rs ON rs.code = @stageCode AND rs.is_active
                  JOIN attachment_types at ON at.code = @typeCode AND at.is_active
                 WHERE td.id = @documentId
                   AND dt.code = @templateCode
                   AND td.status IN ('draft', 'changes_requested')
                   AND EXISTS (
                       SELECT 1
                         FROM report_questions rq
                         JOIN question_attachment_types qat ON qat.report_question_id = rq.id
                        WHERE rq.report_stage_id = rs.id
                          AND rq.is_active
                          AND qat.attachment_type_id = at.id
                   )
                RETURNING id;
                """;
            command.Parameters.AddWithValue("annexId", annexId);
            command.Parameters.AddWithValue("documentId", documentId);
            command.Parameters.AddWithValue("stageCode", stageCode);
            command.Parameters.AddWithValue("typeCode", attachmentTypeCode);
            command.Parameters.AddWithValue("title", title);
            command.Parameters.AddWithValue("sourceReference", (object?)sourceReference ?? DBNull.Value);
            command.Parameters.AddWithValue("userId", userId);
            command.Parameters.AddWithValue("templateCode", SoftexTemplateCode);
            if (await command.ExecuteScalarAsync(cancellationToken) is null)
                throw new InvalidOperationException("Documento, etapa ou tipo de anexo inválido, ou documento não editável.");
        }

        await using (var command = connection.CreateCommand())
        {
            command.Transaction = transaction;
            command.CommandText = """
                INSERT INTO question_annexes (
                    report_question_id, report_annex_id, linked_by_user_id
                )
                SELECT rq.id, @annexId, @userId
                  FROM report_annexes ra
                  JOIN report_questions rq
                    ON rq.report_stage_id = ra.report_stage_id AND rq.is_active
                  JOIN question_attachment_types qat
                    ON qat.report_question_id = rq.id
                   AND qat.attachment_type_id = ra.attachment_type_id
                 WHERE ra.id = @annexId;
                """;
            command.Parameters.AddWithValue("annexId", annexId);
            command.Parameters.AddWithValue("userId", userId);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return annexId;
    }

    public async Task UpsertAnswerAsync(
        Guid documentId,
        string questionCode,
        string answer,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await SetActorAsync(connection, transaction, userId, cancellationToken);

        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
            INSERT INTO report_answers (
                track_document_id, report_question_id, answer,
                created_by_user_id, updated_by_user_id
            )
            SELECT td.id, rq.id, @answer, @userId, @userId
              FROM track_documents td
              JOIN document_templates dt ON dt.id = td.document_template_id
              JOIN report_questions rq ON rq.code = @questionCode AND rq.is_active
             WHERE td.id = @documentId
               AND dt.code = @templateCode
               AND td.status IN ('draft', 'changes_requested')
            ON CONFLICT (track_document_id, report_question_id) DO UPDATE
               SET answer = EXCLUDED.answer,
                   updated_by_user_id = EXCLUDED.updated_by_user_id
            RETURNING id;
            """;
        command.Parameters.AddWithValue("documentId", documentId);
        command.Parameters.AddWithValue("questionCode", questionCode);
        command.Parameters.AddWithValue("answer", answer);
        command.Parameters.AddWithValue("userId", userId);
        command.Parameters.AddWithValue("templateCode", SoftexTemplateCode);

        if (await command.ExecuteScalarAsync(cancellationToken) is null)
            throw new InvalidOperationException("Documento, pergunta ou estado do documento inválido.");

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ReportExportQuestionDTO>> GetExportQuestionsAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var questions = new List<ReportExportQuestionDTO>();
        await using var command = _dataSource.CreateCommand("""
            SELECT stage_code, question_code, question_label,
                   question_display_order, answer, annexes::text
              FROM report_export_questions
             WHERE track_document_id = @documentId
             ORDER BY stage_code, question_display_order, question_code;
            """);
        command.Parameters.AddWithValue("documentId", documentId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            using var annexDocument = JsonDocument.Parse(reader.GetString(5));
            var annexes = annexDocument.RootElement.Clone();
            questions.Add(new ReportExportQuestionDTO(
                reader.GetString(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetInt32(3),
                reader.IsDBNull(4) ? null : reader.GetString(4),
                annexes));
        }

        return questions;
    }

    public async Task<ReportExportContextDTO?> GetExportContextAsync(
        Guid documentId,
        string stageCode,
        CancellationToken cancellationToken = default)
    {
        await using var command = _dataSource.CreateCommand("""
            SELECT t.title, rs.name
              FROM track_documents td
              JOIN document_templates dt ON dt.id = td.document_template_id
              JOIN tracks t ON t.id = td.track_id
              JOIN report_stages rs ON rs.code = @stageCode AND rs.is_active
             WHERE td.id = @documentId
               AND dt.code = @templateCode;
            """);
        command.Parameters.AddWithValue("documentId", documentId);
        command.Parameters.AddWithValue("stageCode", stageCode);
        command.Parameters.AddWithValue("templateCode", SoftexTemplateCode);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        return new ReportExportContextDTO(reader.GetString(0), reader.GetString(1));
    }

    public async Task<AnnexUploadContext> GetUploadContextAsync(
        Guid documentId,
        Guid annexId,
        CancellationToken cancellationToken = default)
    {
        await using var command = _dataSource.CreateCommand("""
            SELECT td.status IN ('draft', 'changes_requested') AS is_editable,
                   count(rai.id) FILTER (WHERE rai.deleted_at IS NULL) AS image_count,
                   COALESCE(max(rai.display_order) FILTER (WHERE rai.deleted_at IS NULL), 0) + 1
              FROM report_annexes ra
              JOIN track_documents td ON td.id = ra.track_document_id
              LEFT JOIN report_annex_images rai ON rai.report_annex_id = ra.id
             WHERE ra.id = @annexId
               AND ra.track_document_id = @documentId
               AND ra.deleted_at IS NULL
             GROUP BY td.status;
            """);
        command.Parameters.AddWithValue("documentId", documentId);
        command.Parameters.AddWithValue("annexId", annexId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            return new AnnexUploadContext(false, false, 0, 1);
        return new AnnexUploadContext(true, reader.GetBoolean(0), checked((int)reader.GetInt64(1)), reader.GetInt32(2));
    }

    public async Task AddImagesAsync(
        Guid documentId,
        Guid annexId,
        Guid userId,
        IReadOnlyList<StoredAttachmentImage> images,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await SetActorAsync(connection, transaction, userId, cancellationToken);

        await using (var guard = connection.CreateCommand())
        {
            guard.Transaction = transaction;
            guard.CommandText = """
                SELECT 1
                  FROM report_annexes ra
                  JOIN track_documents td ON td.id = ra.track_document_id
                 WHERE ra.id = @annexId
                   AND ra.track_document_id = @documentId
                   AND ra.deleted_at IS NULL
                   AND td.status IN ('draft', 'changes_requested')
                 FOR UPDATE OF ra;
                """;
            guard.Parameters.AddWithValue("annexId", annexId);
            guard.Parameters.AddWithValue("documentId", documentId);
            if (await guard.ExecuteScalarAsync(cancellationToken) is null)
                throw new InvalidOperationException("Anexo não encontrado ou documento não editável.");
        }

        int currentImageCount;
        int nextDisplayOrder;
        await using (var command = connection.CreateCommand())
        {
            command.Transaction = transaction;
            command.CommandText = """
                SELECT count(*)::integer,
                       COALESCE(max(display_order), 0) + 1
                  FROM report_annex_images
                 WHERE report_annex_id = @annexId
                   AND deleted_at IS NULL;
                """;
            command.Parameters.AddWithValue("annexId", annexId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            await reader.ReadAsync(cancellationToken);
            currentImageCount = reader.GetInt32(0);
            nextDisplayOrder = reader.GetInt32(1);
        }

        if (currentImageCount + images.Count > ReportAttachmentService.MaximumImagesPerAnnex)
            throw new InvalidOperationException($"Cada anexo pode conter no máximo {ReportAttachmentService.MaximumImagesPerAnnex} imagens.");

        foreach (var image in images)
        {
            await using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = """
                INSERT INTO file_assets (
                    id, provider, storage_key, original_file_name, media_type,
                    size_bytes, sha256, uploaded_by_user_id
                ) VALUES (
                    @fileAssetId, 'local', @storageKey, @fileName, @mediaType,
                    @sizeBytes, @sha256, @userId
                );

                INSERT INTO report_annex_images (
                    id, report_annex_id, file_asset_id, display_order
                ) VALUES (
                    @imageId, @annexId, @fileAssetId, @displayOrder
                );
                """;
            command.Parameters.AddWithValue("fileAssetId", image.FileAssetId);
            command.Parameters.AddWithValue("storageKey", image.StorageKey);
            command.Parameters.AddWithValue("fileName", image.OriginalFileName);
            command.Parameters.AddWithValue("mediaType", image.MediaType);
            command.Parameters.AddWithValue("sizeBytes", image.SizeBytes);
            command.Parameters.AddWithValue("sha256", image.Sha256);
            command.Parameters.AddWithValue("userId", userId);
            command.Parameters.AddWithValue("imageId", image.ImageId);
            command.Parameters.AddWithValue("annexId", annexId);
            command.Parameters.AddWithValue("displayOrder", nextDisplayOrder++);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<AttachmentFileLocation?> GetImageLocationAsync(
        Guid documentId,
        Guid imageId,
        CancellationToken cancellationToken = default)
    {
        await using var command = _dataSource.CreateCommand("""
            SELECT fa.storage_key, COALESCE(fa.media_type, 'application/octet-stream'),
                   fa.original_file_name
              FROM report_annex_images rai
              JOIN report_annexes ra ON ra.id = rai.report_annex_id
              JOIN file_assets fa ON fa.id = rai.file_asset_id
             WHERE rai.id = @imageId
               AND ra.track_document_id = @documentId
               AND rai.deleted_at IS NULL
               AND ra.deleted_at IS NULL
               AND fa.deleted_at IS NULL;
            """);
        command.Parameters.AddWithValue("imageId", imageId);
        command.Parameters.AddWithValue("documentId", documentId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) return null;
        return new AttachmentFileLocation(reader.GetString(0), reader.GetString(1), reader.GetString(2));
    }

    public async Task<string?> DeleteImageAsync(
        Guid documentId,
        Guid imageId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await SetActorAsync(connection, transaction, userId, cancellationToken);

        Guid fileAssetId;
        string storageKey;
        await using (var command = connection.CreateCommand())
        {
            command.Transaction = transaction;
            command.CommandText = """
                SELECT rai.file_asset_id, fa.storage_key,
                       td.status IN ('draft', 'changes_requested') AS is_editable
                  FROM report_annex_images rai
                  JOIN report_annexes ra ON ra.id = rai.report_annex_id
                  JOIN track_documents td ON td.id = ra.track_document_id
                  JOIN file_assets fa ON fa.id = rai.file_asset_id
                 WHERE rai.id = @imageId
                   AND ra.track_document_id = @documentId
                   AND rai.deleted_at IS NULL
                   AND ra.deleted_at IS NULL
                 FOR UPDATE OF rai;
                """;
            command.Parameters.AddWithValue("imageId", imageId);
            command.Parameters.AddWithValue("documentId", documentId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken)) return null;
            if (!reader.GetBoolean(2)) throw new InvalidOperationException("O documento não está em um estado editável.");
            fileAssetId = reader.GetGuid(0);
            storageKey = reader.GetString(1);
        }

        await using (var command = connection.CreateCommand())
        {
            command.Transaction = transaction;
            command.CommandText = """
                UPDATE report_annex_images SET deleted_at = clock_timestamp() WHERE id = @imageId;
                UPDATE file_assets SET deleted_at = clock_timestamp() WHERE id = @fileAssetId;
                """;
            command.Parameters.AddWithValue("imageId", imageId);
            command.Parameters.AddWithValue("fileAssetId", fileAssetId);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return storageKey;
    }

    public async Task<IReadOnlyList<string>?> DeleteAnnexAsync(
        Guid documentId,
        Guid annexId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _dataSource.OpenConnectionAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await SetActorAsync(connection, transaction, userId, cancellationToken);

        await using (var guard = connection.CreateCommand())
        {
            guard.Transaction = transaction;
            guard.CommandText = """
                SELECT td.status IN ('draft', 'changes_requested')
                  FROM report_annexes ra
                  JOIN track_documents td ON td.id = ra.track_document_id
                 WHERE ra.id = @annexId
                   AND ra.track_document_id = @documentId
                   AND ra.deleted_at IS NULL
                 FOR UPDATE OF ra;
                """;
            guard.Parameters.AddWithValue("annexId", annexId);
            guard.Parameters.AddWithValue("documentId", documentId);
            var editable = await guard.ExecuteScalarAsync(cancellationToken);
            if (editable is null) return null;
            if (!(bool)editable) throw new InvalidOperationException("O documento não está em um estado editável.");
        }

        var storageKeys = new List<string>();
        await using (var command = connection.CreateCommand())
        {
            command.Transaction = transaction;
            command.CommandText = """
                SELECT fa.storage_key
                  FROM report_annex_images rai
                  JOIN file_assets fa ON fa.id = rai.file_asset_id
                 WHERE rai.report_annex_id = @annexId
                   AND rai.deleted_at IS NULL
                   AND fa.deleted_at IS NULL;
                """;
            command.Parameters.AddWithValue("annexId", annexId);
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken)) storageKeys.Add(reader.GetString(0));
        }

        await using (var command = connection.CreateCommand())
        {
            command.Transaction = transaction;
            command.CommandText = """
                UPDATE file_assets
                   SET deleted_at = clock_timestamp()
                 WHERE id IN (
                     SELECT file_asset_id
                       FROM report_annex_images
                      WHERE report_annex_id = @annexId AND deleted_at IS NULL
                 );
                UPDATE report_annex_images
                   SET deleted_at = clock_timestamp()
                 WHERE report_annex_id = @annexId AND deleted_at IS NULL;
                DELETE FROM question_annexes WHERE report_annex_id = @annexId;
                UPDATE report_annexes SET deleted_at = clock_timestamp() WHERE id = @annexId;
                """;
            command.Parameters.AddWithValue("annexId", annexId);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return storageKeys;
    }

    private static async Task SetActorAsync(
        NpgsqlConnection connection,
        NpgsqlTransaction transaction,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = "SELECT set_config('app.current_user_id', @userId, true);";
        command.Parameters.AddWithValue("userId", userId.ToString());
        await command.ExecuteScalarAsync(cancellationToken);
    }

    private sealed class TypeBuilder
    {
        public TypeBuilder(Guid id, string code, string name, string? description)
        {
            Id = id;
            Code = code;
            Name = name;
            Description = description;
        }

        public Guid Id { get; }
        public string Code { get; }
        public string Name { get; }
        public string? Description { get; }
        public List<AttachmentQuestionDTO> Questions { get; } = [];
        public List<AnnexBuilder> Annexes { get; } = [];

        public AttachmentTypeDTO Build() => new(
            Id,
            Code,
            Name,
            Description,
            Questions,
            Annexes.Select(annex => annex.Build()).ToArray());
    }

    private sealed class AnnexBuilder
    {
        public AnnexBuilder(
            Guid id,
            string title,
            string? sourceReference,
            string validationStatus,
            string? validationNotes,
            int version,
            DateTimeOffset createdAt,
            IReadOnlyList<string> questionCodes)
        {
            Id = id;
            Title = title;
            SourceReference = sourceReference;
            ValidationStatus = validationStatus;
            ValidationNotes = validationNotes;
            Version = version;
            CreatedAt = createdAt;
            QuestionCodes = questionCodes;
        }

        public Guid Id { get; }
        public string Title { get; }
        public string? SourceReference { get; }
        public string ValidationStatus { get; }
        public string? ValidationNotes { get; }
        public int Version { get; }
        public DateTimeOffset CreatedAt { get; }
        public IReadOnlyList<string> QuestionCodes { get; }
        public List<AttachmentImageDTO> Images { get; } = [];

        public ReportAnnexDTO Build() => new(
            Id,
            Title,
            SourceReference,
            ValidationStatus,
            ValidationNotes,
            Version,
            CreatedAt,
            QuestionCodes,
            Images);
    }
}
