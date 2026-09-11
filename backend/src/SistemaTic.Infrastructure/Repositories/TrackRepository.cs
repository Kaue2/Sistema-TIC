using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class TrackRepository : ITrackRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public TrackRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static Track Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        Guid? ideaId = reader.IsDBNull(1) ? null : reader.GetGuid(1);
        Guid? sourceTrackId = reader.IsDBNull(2) ? null : reader.GetGuid(2);
        Guid knowledgeAreaId = reader.IsDBNull(3) ? Guid.Empty : reader.GetGuid(3);
        Guid? categoryId = reader.IsDBNull(4) ? null : reader.GetGuid(4);
        string title = reader.IsDBNull(5) ? string.Empty : reader.GetString(5);
        string? shortDescription = reader.IsDBNull(6) ? null : reader.GetString(6);
        string modality = reader.IsDBNull(7) ? string.Empty : reader.GetString(7);
        string? learningLevel = reader.IsDBNull(8) ? null : reader.GetString(8);
        string status = reader.IsDBNull(9) ? string.Empty : reader.GetString(9);
        DateOnly? plannedProductionStartsOn = reader.IsDBNull(10) ? null : reader.GetFieldValue<DateOnly>(10);
        DateOnly? plannedProductionEndsOn = reader.IsDBNull(11) ? null : reader.GetFieldValue<DateOnly>(11);
        DateOnly? plannedTrackStartsOn = reader.IsDBNull(12) ? null : reader.GetFieldValue<DateOnly>(12);
        DateOnly? plannedTrackEndsOn = reader.IsDBNull(13) ? null : reader.GetFieldValue<DateOnly>(13);
        DateTimeOffset? registrationStartsAt = reader.IsDBNull(14) ? null : reader.GetFieldValue<DateTimeOffset>(14);
        DateTimeOffset? registrationEndsAt = reader.IsDBNull(15) ? null : reader.GetFieldValue<DateTimeOffset>(15);
        int onlineWorkloadMinutes = reader.IsDBNull(16) ? 0 : reader.GetInt32(16);
        int inPersonWorkloadMinutes = reader.IsDBNull(17) ? 0 : reader.GetInt32(17);
        int totalWorkloadMinutes = reader.IsDBNull(18) ? 0 : reader.GetInt32(18);
        int? plannedCapacity = reader.IsDBNull(19) ? null : reader.GetInt32(19);
        string? targetAudience = reader.IsDBNull(20) ? null : reader.GetString(20);
        string? prerequisites = reader.IsDBNull(21) ? null : reader.GetString(21);
        decimal? attendanceRequirementPercent = reader.IsDBNull(22) ? null : reader.GetDecimal(22);
        Guid createdByUserId = reader.IsDBNull(23) ? Guid.Empty : reader.GetGuid(23);
        DateTimeOffset createdAt = reader.IsDBNull(24) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(24);
        DateTimeOffset updatedAt = reader.IsDBNull(25) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(25);
        DateTimeOffset? cancelledAt = reader.IsDBNull(26) ? null : reader.GetFieldValue<DateTimeOffset>(26);
        int code = reader.IsDBNull(27) ? 0 : reader.GetInt32(27);

        return new Track(id, code, ideaId, sourceTrackId, knowledgeAreaId, categoryId, title,
                          shortDescription, modality, learningLevel, status, plannedProductionStartsOn,
                          plannedProductionEndsOn, plannedTrackStartsOn, plannedTrackEndsOn,
                          registrationStartsAt, registrationEndsAt, onlineWorkloadMinutes,
                          inPersonWorkloadMinutes, totalWorkloadMinutes, plannedCapacity, targetAudience,
                          prerequisites, attendanceRequirementPercent, createdByUserId, createdAt,
                          updatedAt, cancelledAt);
    }

    public async Task<Track?> GetByIdAsync(Guid id)
    {
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM tracks WHERE id = @id");
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }
        return null;
    }

    public async Task<IEnumerable<Track>> GetAllAsync()
    {
        List<Track> tracks = new List<Track>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM tracks ORDER BY created_at DESC");

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tracks.Add(Map(reader));
        }
        return tracks;
    }

    public async Task<Track> CreateAsync(
        Guid? ideaId,
        Guid? sourceTrackId,
        Guid knowledgeAreaId,
        Guid? categoryId,
        string title,
        string? shortDescription,
        string modality,
        string? learningLevel,
        DateOnly? plannedProductionStartsOn,
        DateOnly? plannedProductionEndsOn,
        DateOnly? plannedTrackStartsOn,
        DateOnly? plannedTrackEndsOn,
        DateTimeOffset? registrationStartsAt,
        DateTimeOffset? registrationEndsAt,
        int onlineWorkloadMinutes,
        int inPersonWorkloadMinutes,
        int? plannedCapacity,
        string? targetAudience,
        string? prerequisites,
        decimal? attendanceRequirementPercent,
        Guid createdByUserId)
    {
        // code não entra no insert: é gerado automaticamente pelo banco (GENERATED ALWAYS AS IDENTITY)
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO tracks (
                idea_id, source_track_id, knowledge_area_id, category_id, title, short_description,
                modality, learning_level, planned_production_starts_on, planned_production_ends_on,
                planned_track_starts_on, planned_track_ends_on, registration_starts_at, registration_ends_at,
                online_workload_minutes, in_person_workload_minutes, planned_capacity, target_audience,
                prerequisites, attendance_requirement_percent, created_by_user_id
            )
            VALUES (
                @ideaId, @sourceTrackId, @knowledgeAreaId, @categoryId, @title, @shortDescription,
                @modality, @learningLevel, @plannedProductionStartsOn, @plannedProductionEndsOn,
                @plannedTrackStartsOn, @plannedTrackEndsOn, @registrationStartsAt, @registrationEndsAt,
                @onlineWorkloadMinutes, @inPersonWorkloadMinutes, @plannedCapacity, @targetAudience,
                @prerequisites, @attendanceRequirementPercent, @createdByUserId
            )
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("ideaId", (object?)ideaId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("sourceTrackId", (object?)sourceTrackId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("knowledgeAreaId", knowledgeAreaId);
        cmd.Parameters.AddWithValue("categoryId", (object?)categoryId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("title", title);
        cmd.Parameters.AddWithValue("shortDescription", (object?)shortDescription ?? DBNull.Value);
        cmd.Parameters.AddWithValue("modality", modality);
        cmd.Parameters.AddWithValue("learningLevel", (object?)learningLevel ?? DBNull.Value);
        cmd.Parameters.AddWithValue("plannedProductionStartsOn", (object?)plannedProductionStartsOn ?? DBNull.Value);
        cmd.Parameters.AddWithValue("plannedProductionEndsOn", (object?)plannedProductionEndsOn ?? DBNull.Value);
        cmd.Parameters.AddWithValue("plannedTrackStartsOn", (object?)plannedTrackStartsOn ?? DBNull.Value);
        cmd.Parameters.AddWithValue("plannedTrackEndsOn", (object?)plannedTrackEndsOn ?? DBNull.Value);
        cmd.Parameters.AddWithValue("registrationStartsAt", (object?)registrationStartsAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("registrationEndsAt", (object?)registrationEndsAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("onlineWorkloadMinutes", onlineWorkloadMinutes);
        cmd.Parameters.AddWithValue("inPersonWorkloadMinutes", inPersonWorkloadMinutes);
        cmd.Parameters.AddWithValue("plannedCapacity", (object?)plannedCapacity ?? DBNull.Value);
        cmd.Parameters.AddWithValue("targetAudience", (object?)targetAudience ?? DBNull.Value);
        cmd.Parameters.AddWithValue("prerequisites", (object?)prerequisites ?? DBNull.Value);
        cmd.Parameters.AddWithValue("attendanceRequirementPercent", (object?)attendanceRequirementPercent ?? DBNull.Value);
        cmd.Parameters.AddWithValue("createdByUserId", createdByUserId);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return Map(reader);
    }
}
