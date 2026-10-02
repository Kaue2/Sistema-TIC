using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface ITrackDocumentRepository
{
    public Task<IEnumerable<TrackDocument>> GetByTrackIdAsync(Guid trackId);
    public Task<TrackDocument?> GetSoftexDocumentByTrackIdAsync(Guid trackId);
    public Task<TrackDocument?> GetByIdAsync(Guid id);
    public Task<TrackDocument> ReplaceContentAsync(
        Guid trackDocumentId,
        string newContent,
        Guid changedByUserId);
    public Task<TrackDocument> SubmitForReviewAsync(
        Guid trackDocumentId,
        Guid updatedByUserId);
    public Task<TrackDocument> TransitionStatusAsync(
        Guid trackDocumentId,
        string[] fromStatuses,
        string toStatus,
        Guid updatedByUserId,
        string? reviewComments = null);
}
