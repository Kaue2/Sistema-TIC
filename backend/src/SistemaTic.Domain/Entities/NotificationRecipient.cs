namespace SistemaTic.Domain.Entities;

public class NotificationRecipient
{
    public Guid NotificationId { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset? DeliveredAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }

    public NotificationRecipient(Guid notificationId, Guid userId, DateTimeOffset? deliveredAt,
                                  DateTimeOffset? readAt, DateTimeOffset? archivedAt)
    {
        this.NotificationId = notificationId;
        this.UserId = userId;
        this.DeliveredAt = deliveredAt;
        this.ReadAt = readAt;
        this.ArchivedAt = archivedAt;
    }
}
