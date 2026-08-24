using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface ITrackEventRepository
{
    public Task<IEnumerable<TrackEvent>> GetByTrackIdAsync(Guid trackId);
    public Task<TrackEvent> CreateAsync(
        Guid trackId,
        string eventType,
        string title,
        string? description,
        DateTimeOffset startsAt,
        DateTimeOffset endsAt,
        string? timezone,
        string? locationName,
        string? roomName,
        int? roomCapacity,
        string? externalReference,
        Guid createdByUserId);
}
