using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface ITrackDocumentRepository
{
    public Task<IEnumerable<TrackDocument>> GetByTrackIdAsync(Guid trackId);
    public Task<TrackDocument?> GetSoftexDocumentByTrackIdAsync(Guid trackId);
    public Task<TrackDocument?> GetByIdAsync(Guid id);
    public Task<TrackDocument> CreateAsync(
        Guid trackId,
        Guid documentTemplateId,
        Guid templateVersionId,
        Guid createdByUserId,
        Guid updatedByUserId);
    public Task<TrackDocument> ReplaceContentAsync(
        Guid trackDocumentId,
        string newContent,
        Guid changedByUserId);
    public Task<TrackDocument> SubmitForReviewAsync(
        Guid trackDocumentId,
        Guid updatedByUserId);
}
