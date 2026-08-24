using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class NotificationRecipientRepository : INotificationRecipientRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public NotificationRecipientRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static NotificationRecipient Map(NpgsqlDataReader reader)
    {
        Guid notificationId = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        Guid userId = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
        DateTimeOffset? deliveredAt = reader.IsDBNull(2) ? null : reader.GetFieldValue<DateTimeOffset>(2);
        DateTimeOffset? readAt = reader.IsDBNull(3) ? null : reader.GetFieldValue<DateTimeOffset>(3);
        DateTimeOffset? archivedAt = reader.IsDBNull(4) ? null : reader.GetFieldValue<DateTimeOffset>(4);

        return new NotificationRecipient(notificationId, userId, deliveredAt, readAt, archivedAt);
    }

    public async Task<IEnumerable<NotificationRecipient>> GetByUserIdAsync(Guid userId)
    {
        List<NotificationRecipient> recipients = new List<NotificationRecipient>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM notification_recipients WHERE user_id = @userId");
        cmd.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            recipients.Add(Map(reader));
        }
        return recipients;
    }

    public async Task<NotificationRecipient> CreateAsync(Guid notificationId, Guid userId)
    {
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO notification_recipients (notification_id, user_id)
            VALUES (@notificationId, @userId)
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("notificationId", notificationId);
        cmd.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return Map(reader);
    }
}
