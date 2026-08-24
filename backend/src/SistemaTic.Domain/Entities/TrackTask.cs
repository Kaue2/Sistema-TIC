namespace SistemaTic.Domain.Entities;

public class TrackTask
{
    public Guid Id { get; set; }
    public Guid TrackId { get; set; }
    public Guid? SourceTemplateTaskId { get; set; }
    public string Phase { get; set; }
    public string? Code { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; }
    public DateTimeOffset? DueAt { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsRequired { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public Guid? CompletedByUserId { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public TrackTask(Guid id, Guid trackId, Guid? sourceTemplateTaskId, string phase, string? code,
                      string title, string? description, string status, DateTimeOffset? dueAt,
                      int displayOrder, bool isRequired, DateTimeOffset? completedAt,
                      Guid? completedByUserId, Guid? createdByUserId, DateTimeOffset createdAt,
                      DateTimeOffset updatedAt)
    {
        this.Id = id;
        this.TrackId = trackId;
        this.SourceTemplateTaskId = sourceTemplateTaskId;
        this.Phase = phase;
        this.Code = code;
        this.Title = title;
        this.Description = description;
        this.Status = status;
        this.DueAt = dueAt;
        this.DisplayOrder = displayOrder;
        this.IsRequired = isRequired;
        this.CompletedAt = completedAt;
        this.CompletedByUserId = completedByUserId;
        this.CreatedByUserId = createdByUserId;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
    }
}
