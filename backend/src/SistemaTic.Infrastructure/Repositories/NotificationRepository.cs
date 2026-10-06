using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Application.DTO;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public NotificationRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static Notification Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        string notificationType = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
        string title = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
        string message = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
        Guid? trackId = reader.IsDBNull(4) ? null : reader.GetGuid(4);
        Guid? trackTaskId = reader.IsDBNull(5) ? null : reader.GetGuid(5);
        Guid? trackDocumentId = reader.IsDBNull(6) ? null : reader.GetGuid(6);
        string? actionUrl = reader.IsDBNull(7) ? null : reader.GetString(7);
        Guid? createdByUserId = reader.IsDBNull(8) ? null : reader.GetGuid(8);
        DateTimeOffset createdAt = reader.IsDBNull(9) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(9);
        DateTimeOffset? expiresAt = reader.IsDBNull(10) ? null : reader.GetFieldValue<DateTimeOffset>(10);

        return new Notification(id, notificationType, title, message, trackId, trackTaskId,
                                 trackDocumentId, actionUrl, createdByUserId, createdAt, expiresAt);
    }

    public async Task<IReadOnlyList<NotificationProjection>> GetByRecipientAsync(Guid userId)
    {
        var notifications = new List<NotificationProjection>();
        await using var command = _dataSource.CreateCommand("""
            SELECT
                n.id,
                n.notification_type,
                n.title,
                n.message,
                n.created_at,
                cb.full_name,
                nr.read_at,
                t.id,
                t.code::text,
                t.title,
                t.modality,
                t.status,
                t.planned_track_starts_on,
                ka.name,
                td.id,
                td.status,
                dt.name,
                dt.code,
                tt.id,
                tt.title,
                tt.status
              FROM notification_recipients nr
              JOIN notifications n ON n.id = nr.notification_id
              LEFT JOIN users cb ON cb.id = n.created_by_user_id
              LEFT JOIN tracks t ON t.id = n.track_id
              LEFT JOIN knowledge_areas ka ON ka.id = t.knowledge_area_id
              LEFT JOIN track_documents td ON td.id = n.track_document_id
              LEFT JOIN document_templates dt ON dt.id = td.document_template_id
              LEFT JOIN track_tasks tt ON tt.id = n.track_task_id
             WHERE nr.user_id = @userId
               AND nr.archived_at IS NULL
               AND (n.expires_at IS NULL OR n.expires_at > clock_timestamp())
             ORDER BY n.created_at DESC, n.id;
            """);
        command.Parameters.AddWithValue("userId", userId);

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            notifications.Add(new NotificationProjection(
                reader.GetGuid(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.IsDBNull(3) ? null : reader.GetString(3),
                reader.GetFieldValue<DateTimeOffset>(4),
                reader.IsDBNull(5) ? null : reader.GetString(5),
                reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(6),
                reader.IsDBNull(7) ? null : reader.GetGuid(7),
                reader.IsDBNull(8) ? null : reader.GetString(8),
reader.IsDBNull(9) ? null : reader.GetString(9),
                reader.IsDBNull(10) ? null : reader.GetString(10),
                reader.IsDBNull(11) ? null : reader.GetString(11),
                reader.IsDBNull(12) ? null : reader.GetFieldValue<DateOnly>(12),
                reader.IsDBNull(13) ? null : reader.GetString(13),
                reader.IsDBNull(14) ? null : reader.GetGuid(14),
                reader.IsDBNull(15) ? null : reader.GetString(15),
                reader.IsDBNull(16) ? null : reader.GetString(16),
                reader.IsDBNull(17) ? null : reader.GetString(17),
                reader.IsDBNull(18) ? null : reader.GetGuid(18),
                reader.IsDBNull(19) ? null : reader.GetString(19),
                reader.IsDBNull(20) ? null : reader.GetString(20)));
        }

        return notifications;
    }

    public async Task<bool> MarkReadAsync(Guid userId, Guid notificationId)
    {
        await using var command = _dataSource.CreateCommand("""
            UPDATE notification_recipients
               SET read_at = COALESCE(read_at, clock_timestamp())
             WHERE notification_id = @notificationId
               AND user_id = @userId
               AND archived_at IS NULL;
            """);
        command.Parameters.AddWithValue("notificationId", notificationId);
        command.Parameters.AddWithValue("userId", userId);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<int> MarkAllReadAsync(Guid userId)
    {
        await using var command = _dataSource.CreateCommand("""
            UPDATE notification_recipients
               SET read_at = COALESCE(read_at, clock_timestamp())
             WHERE user_id = @userId
               AND archived_at IS NULL
               AND read_at IS NULL;
            """);
        command.Parameters.AddWithValue("userId", userId);

        return await command.ExecuteNonQueryAsync();
    }

    public async Task<Notification?> GetByIdAsync(Guid id)
    {
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM notifications WHERE id = @id");
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }
        return null;
    }

    public async Task<Notification> CreateAsync(
        string notificationType,
        string title,
        string message,
        Guid? trackId,
        Guid? trackTaskId,
        Guid? trackDocumentId,
        string? actionUrl,
        Guid? createdByUserId,
        DateTimeOffset? expiresAt)
    {
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO notifications (
                notification_type, title, message, track_id, track_task_id, track_document_id,
                action_url, created_by_user_id, expires_at
            )
            VALUES (
                @notificationType, @title, @message, @trackId, @trackTaskId, @trackDocumentId,
                @actionUrl, @createdByUserId, @expiresAt
            )
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("notificationType", notificationType);
        cmd.Parameters.AddWithValue("title", title);
        cmd.Parameters.AddWithValue("message", message);
        cmd.Parameters.AddWithValue("trackId", (object?)trackId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("trackTaskId", (object?)trackTaskId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("trackDocumentId", (object?)trackDocumentId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("actionUrl", (object?)actionUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("createdByUserId", (object?)createdByUserId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("expiresAt", (object?)expiresAt ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return Map(reader);
    }
}
