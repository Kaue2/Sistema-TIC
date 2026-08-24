using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface INotificationRecipientRepository
{
    public Task<IEnumerable<NotificationRecipient>> GetByUserIdAsync(Guid userId);
    public Task<NotificationRecipient> CreateAsync(Guid notificationId, Guid userId);
}
