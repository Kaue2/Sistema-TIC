using System.Text.Json;

namespace SistemaTic.Application.DTO;

public record AttachmentQuestionDTO(
    Guid Id,
    string Code,
    string Label,
    string? Notes);

public record AttachmentImageDTO(
    Guid Id,
    string OriginalFileName,
    string MediaType,
    long SizeBytes,
    int DisplayOrder,
    string? Caption,
    string ContentUrl);

public record ReportAnnexDTO(
    Guid Id,
    string Title,
    string? SourceReference,
    string ValidationStatus,
    string? ValidationNotes,
    int Version,
    DateTimeOffset CreatedAt,
    IReadOnlyList<string> QuestionCodes,
    IReadOnlyList<AttachmentImageDTO> Images);

public record AttachmentTypeDTO(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    IReadOnlyList<AttachmentQuestionDTO> Questions,
    IReadOnlyList<ReportAnnexDTO> Annexes);

public record AttachmentStageDTO(
    Guid Id,
    string Code,
    string Name,
    bool IsEditable,
    IReadOnlyList<AttachmentTypeDTO> AttachmentTypes);

public record CreateReportAnnexDTO(
    string StageCode,
    string AttachmentTypeCode,
    string? Title,
    string? SourceReference = null);

public record SaveReportAnswerDTO(string Answer);

public record CreateSoftexDocxExportDTO(IReadOnlyList<string>? StageCodes);

public record CreateMultiTrailSoftexDocxExportDTO(
    IReadOnlyList<Guid>? DocumentIds,
    IReadOnlyList<string>? StageCodes);

public record ReportExportContextDTO(
    string TrackTitle,
    string StageName);

public record ReportExportQuestionDTO(
    string StageCode,
    string QuestionCode,
    string QuestionLabel,
    int QuestionDisplayOrder,
    string? Answer,
    JsonElement Annexes);

public sealed record AttachmentUploadFile(
    string FileName,
    string ContentType,
    long Length,
    Stream Content);

public sealed record AttachmentDownload(
    Stream Content,
    string MediaType,
    string FileName);

public sealed record AnnexUploadContext(
    bool Exists,
    bool IsEditable,
    int CurrentImageCount,
    int NextDisplayOrder);

public sealed record StoredAttachmentImage(
    Guid ImageId,
    Guid FileAssetId,
    string StorageKey,
    string OriginalFileName,
    string MediaType,
    long SizeBytes,
    string Sha256,
    int DisplayOrder);

public sealed record AttachmentFileLocation(
    string StorageKey,
    string MediaType,
    string OriginalFileName);
