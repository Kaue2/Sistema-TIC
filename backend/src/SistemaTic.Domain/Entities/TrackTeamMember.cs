namespace SistemaTic.Domain.Entities;

public class TrackTeamMember
{
    public Guid Id { get; set; }
    public Guid TrackId { get; set; }
    public Guid UserId { get; set; }
    public string Responsibility { get; set; }
    public bool IsLead { get; set; }
    public DateOnly StartsOn { get; set; }
    public DateOnly? EndsOn { get; set; }
    public Guid AssignedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public TrackTeamMember(Guid id, Guid trackId, Guid userId, string responsibility, bool isLead,
                            DateOnly startsOn, DateOnly? endsOn, Guid assignedByUserId,
                            DateTimeOffset createdAt, DateTimeOffset updatedAt)
    {
        this.Id = id;
        this.TrackId = trackId;
        this.UserId = userId;
        this.Responsibility = responsibility;
        this.IsLead = isLead;
        this.StartsOn = startsOn;
        this.EndsOn = endsOn;
        this.AssignedByUserId = assignedByUserId;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
    }
}
