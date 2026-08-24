using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class TrackEventRepository : ITrackEventRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public TrackEventRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static TrackEvent Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        Guid trackId = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
        string eventType = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
        string title = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
        string? description = reader.IsDBNull(4) ? null : reader.GetString(4);
        DateTimeOffset startsAt = reader.IsDBNull(5) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(5);
        DateTimeOffset endsAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);
        string timezone = reader.IsDBNull(7) ? string.Empty : reader.GetString(7);
        string? locationName = reader.IsDBNull(8) ? null : reader.GetString(8);
        string? roomName = reader.IsDBNull(9) ? null : reader.GetString(9);
        int? roomCapacity = reader.IsDBNull(10) ? null : reader.GetInt32(10);
        string? externalReference = reader.IsDBNull(11) ? null : reader.GetString(11);
        Guid createdByUserId = reader.IsDBNull(12) ? Guid.Empty : reader.GetGuid(12);
        DateTimeOffset createdAt = reader.IsDBNull(13) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(13);
        DateTimeOffset updatedAt = reader.IsDBNull(14) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(14);

        return new TrackEvent(id, trackId, eventType, title, description, startsAt, endsAt, timezone,
                               locationName, roomName, roomCapacity, externalReference, createdByUserId,
                               createdAt, updatedAt);
    }

    public async Task<IEnumerable<TrackEvent>> GetByTrackIdAsync(Guid trackId)
    {
        List<TrackEvent> events = new List<TrackEvent>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM track_events WHERE track_id = @trackId ORDER BY starts_at");
        cmd.Parameters.AddWithValue("trackId", trackId);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            events.Add(Map(reader));
        }
        return events;
    }

    public async Task<TrackEvent> CreateAsync(
        Guid trackId,
        string eventType,
        string title,
        string? description,
        DateTimeOffset startsAt,
        DateTimeOffset endsAt,
        string? timezone,
        string? locationName,
        string? roomName,
        int? roomCapacity,
        string? externalReference,
        Guid createdByUserId)
    {
        // timezone nulo deixa o banco usar o default ('America/Sao_Paulo')
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO track_events (
                track_id, event_type, title, description, starts_at, ends_at, timezone,
                location_name, room_name, room_capacity, external_reference, created_by_user_id
            )
            VALUES (
                @trackId, @eventType, @title, @description, @startsAt, @endsAt,
                COALESCE(@timezone, 'America/Sao_Paulo'),
                @locationName, @roomName, @roomCapacity, @externalReference, @createdByUserId
            )
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("trackId", trackId);
        cmd.Parameters.AddWithValue("eventType", eventType);
        cmd.Parameters.AddWithValue("title", title);
        cmd.Parameters.AddWithValue("description", (object?)description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("startsAt", startsAt);
        cmd.Parameters.AddWithValue("endsAt", endsAt);
        cmd.Parameters.AddWithValue("timezone", (object?)timezone ?? DBNull.Value);
        cmd.Parameters.AddWithValue("locationName", (object?)locationName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("roomName", (object?)roomName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("roomCapacity", (object?)roomCapacity ?? DBNull.Value);
        cmd.Parameters.AddWithValue("externalReference", (object?)externalReference ?? DBNull.Value);
        cmd.Parameters.AddWithValue("createdByUserId", createdByUserId);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return Map(reader);
    }
}
