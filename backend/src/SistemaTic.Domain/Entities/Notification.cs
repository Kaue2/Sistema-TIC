namespace SistemaTic.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public string NotificationType { get; set; }
    public string Title { get; set; }
    public string Message { get; set; }
    public Guid? TrackId { get; set; }
    public Guid? TrackTaskId { get; set; }
    public Guid? TrackDocumentId { get; set; }
    public string? ActionUrl { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }

    public Notification(Guid id, string notificationType, string title, string message, Guid? trackId,
                         Guid? trackTaskId, Guid? trackDocumentId, string? actionUrl,
                         Guid? createdByUserId, DateTimeOffset createdAt, DateTimeOffset? expiresAt)
    {
        this.Id = id;
        this.NotificationType = notificationType;
        this.Title = title;
        this.Message = message;
        this.TrackId = trackId;
        this.TrackTaskId = trackTaskId;
        this.TrackDocumentId = trackDocumentId;
        this.ActionUrl = actionUrl;
        this.CreatedByUserId = createdByUserId;
        this.CreatedAt = createdAt;
        this.ExpiresAt = expiresAt;
    }
}
