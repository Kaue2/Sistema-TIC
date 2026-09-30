using SistemaTic.Application.DTO;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface INotificationRepository
{
    public Task<Notification?> GetByIdAsync(Guid id);
    public Task<Notification> CreateAsync(
        string notificationType,
        string title,
        string message,
        Guid? trackId,
        Guid? trackTaskId,
        Guid? trackDocumentId,
        string? actionUrl,
        Guid? createdByUserId,
        DateTimeOffset? expiresAt);

    public Task<IReadOnlyList<NotificationProjection>> GetByRecipientAsync(Guid userId);
    public Task<bool> MarkReadAsync(Guid userId, Guid notificationId);
    public Task<int> MarkAllReadAsync(Guid userId);
}