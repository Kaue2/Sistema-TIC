namespace SistemaTic.Domain.Entities;

public class UserJobPosition
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid JobPositionId { get; set; }
    public DateOnly StartsOn { get; set; }
    public DateOnly? EndsOn { get; set; }
    public string? Notes { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public UserJobPosition(Guid id, Guid userId, Guid jobPositionId, DateOnly startsOn, DateOnly? endsOn,
                            string? notes, Guid? createdByUserId, DateTimeOffset createdAt, DateTimeOffset updatedAt)
    {
        this.Id = id;
        this.UserId = userId;
        this.JobPositionId = jobPositionId;
        this.StartsOn = startsOn;
        this.EndsOn = endsOn;
        this.Notes = notes;
        this.CreatedByUserId = createdByUserId;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
    }
}
