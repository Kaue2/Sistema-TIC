namespace SistemaTic.Domain.Entities;

public class TrackEvent
{
    public Guid Id { get; set; }
    public Guid TrackId { get; set; }
    public string EventType { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset StartsAt { get; set; }
    public DateTimeOffset EndsAt { get; set; }
    public string Timezone { get; set; }
    public string? LocationName { get; set; }
    public string? RoomName { get; set; }
    public int? RoomCapacity { get; set; }
    public string? ExternalReference { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public TrackEvent(Guid id, Guid trackId, string eventType, string title, string? description,
                       DateTimeOffset startsAt, DateTimeOffset endsAt, string timezone,
                       string? locationName, string? roomName, int? roomCapacity,
                       string? externalReference, Guid createdByUserId, DateTimeOffset createdAt,
                       DateTimeOffset updatedAt)
    {
        this.Id = id;
        this.TrackId = trackId;
        this.EventType = eventType;
        this.Title = title;
        this.Description = description;
        this.StartsAt = startsAt;
        this.EndsAt = endsAt;
        this.Timezone = timezone;
        this.LocationName = locationName;
        this.RoomName = roomName;
        this.RoomCapacity = roomCapacity;
        this.ExternalReference = externalReference;
        this.CreatedByUserId = createdByUserId;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
    }
}
