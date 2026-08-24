using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface ITrackDocumentRepository
{
    public Task<IEnumerable<TrackDocument>> GetByTrackIdAsync(Guid trackId);
    public Task<TrackDocument> CreateAsync(
        Guid trackId,
        Guid documentTemplateId,
        Guid templateVersionId,
        Guid createdByUserId,
        Guid updatedByUserId);
}
