using Npgsql;
using SistemaTic.Application.Contracts;
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
