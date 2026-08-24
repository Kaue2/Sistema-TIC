using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class TrackTaskRepository : ITrackTaskRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public TrackTaskRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static TrackTask Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        Guid trackId = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
        Guid? sourceTemplateTaskId = reader.IsDBNull(2) ? null : reader.GetGuid(2);
        string phase = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
        string? code = reader.IsDBNull(4) ? null : reader.GetString(4);
        string title = reader.IsDBNull(5) ? string.Empty : reader.GetString(5);
        string? description = reader.IsDBNull(6) ? null : reader.GetString(6);
        string status = reader.IsDBNull(7) ? string.Empty : reader.GetString(7);
        DateTimeOffset? dueAt = reader.IsDBNull(8) ? null : reader.GetFieldValue<DateTimeOffset>(8);
        int displayOrder = reader.IsDBNull(9) ? 0 : reader.GetInt32(9);
        bool isRequired = reader.IsDBNull(10) ? false : reader.GetBoolean(10);
        DateTimeOffset? completedAt = reader.IsDBNull(11) ? null : reader.GetFieldValue<DateTimeOffset>(11);
        Guid? completedByUserId = reader.IsDBNull(12) ? null : reader.GetGuid(12);
        Guid? createdByUserId = reader.IsDBNull(13) ? null : reader.GetGuid(13);
        DateTimeOffset createdAt = reader.IsDBNull(14) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(14);
        DateTimeOffset updatedAt = reader.IsDBNull(15) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(15);

        return new TrackTask(id, trackId, sourceTemplateTaskId, phase, code, title, description, status,
                              dueAt, displayOrder, isRequired, completedAt, completedByUserId,
                              createdByUserId, createdAt, updatedAt);
    }

    public async Task<IEnumerable<TrackTask>> GetByTrackIdAsync(Guid trackId)
    {
        List<TrackTask> tasks = new List<TrackTask>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM track_tasks WHERE track_id = @trackId ORDER BY phase, display_order");
        cmd.Parameters.AddWithValue("trackId", trackId);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tasks.Add(Map(reader));
        }
        return tasks;
    }

    public async Task<TrackTask> CreateAsync(
        Guid trackId,
        Guid? sourceTemplateTaskId,
        string phase,
        string? code,
        string title,
        string? description,
        DateTimeOffset? dueAt,
        int displayOrder,
        bool isRequired,
        Guid? createdByUserId)
    {
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO track_tasks (
                track_id, source_template_task_id, phase, code, title, description,
                due_at, display_order, is_required, created_by_user_id
            )
            VALUES (
                @trackId, @sourceTemplateTaskId, @phase, @code, @title, @description,
                @dueAt, @displayOrder, @isRequired, @createdByUserId
            )
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("trackId", trackId);
        cmd.Parameters.AddWithValue("sourceTemplateTaskId", (object?)sourceTemplateTaskId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("phase", phase);
        cmd.Parameters.AddWithValue("code", (object?)code ?? DBNull.Value);
        cmd.Parameters.AddWithValue("title", title);
        cmd.Parameters.AddWithValue("description", (object?)description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("dueAt", (object?)dueAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("displayOrder", displayOrder);
        cmd.Parameters.AddWithValue("isRequired", isRequired);
        cmd.Parameters.AddWithValue("createdByUserId", (object?)createdByUserId ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return Map(reader);
    }
}
