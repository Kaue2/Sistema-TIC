using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface ITrackTaskRepository
{
    public Task<IEnumerable<TrackTask>> GetByTrackIdAsync(Guid trackId);
    public Task<TrackTask> CreateAsync(
        Guid trackId,
        Guid? sourceTemplateTaskId,
        string phase,
        string? code,
        string title,
        string? description,
        DateTimeOffset? dueAt,
        int displayOrder,
        bool isRequired,
        Guid? createdByUserId);
}
