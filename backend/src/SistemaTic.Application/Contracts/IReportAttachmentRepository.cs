using SistemaTic.Application.DTO;

namespace SistemaTic.Application.Contracts;

public interface IReportAttachmentRepository
{
    Task<AttachmentStageDTO?> GetStageAsync(
        Guid documentId,
        string stageCode,
        CancellationToken cancellationToken = default);

    Task<Guid> CreateAnnexAsync(
        Guid documentId,
        string stageCode,
        string attachmentTypeCode,
        string title,
        string? sourceReference,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task UpsertAnswerAsync(
        Guid documentId,
        string questionCode,
        string answer,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<ReportExportContextDTO?> GetExportContextAsync(
        Guid documentId,
        string stageCode,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ReportExportQuestionDTO>> GetExportQuestionsAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<AnnexUploadContext> GetUploadContextAsync(
        Guid documentId,
        Guid annexId,
        CancellationToken cancellationToken = default);

    Task AddImagesAsync(
        Guid documentId,
        Guid annexId,
        Guid userId,
        IReadOnlyList<StoredAttachmentImage> images,
        CancellationToken cancellationToken = default);

    Task<AttachmentFileLocation?> GetImageLocationAsync(
        Guid documentId,
        Guid imageId,
        CancellationToken cancellationToken = default);

    Task<string?> DeleteImageAsync(
        Guid documentId,
        Guid imageId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>?> DeleteAnnexAsync(
        Guid documentId,
        Guid annexId,
        Guid userId,
        CancellationToken cancellationToken = default);
}
