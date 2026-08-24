using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface ITrackIdeaRepository
{
    public Task<TrackIdea?> GetByIdAsync(Guid id);
    public Task<TrackIdea> CreateAsync(
        string title,
        string description,
        Guid? suggestedKnowledgeAreaId,
        Guid? proposedByUserId,
        string? proposerName,
        string? proposerContact);
}
