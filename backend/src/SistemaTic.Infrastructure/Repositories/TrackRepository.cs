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
        string? code = reader.IsDBNull(1) ? null : reader.GetString(1);
        Guid? ideaId = reader.IsDBNull(2) ? null : reader.GetGuid(2);
        Guid? sourceTrackId = reader.IsDBNull(3) ? null : reader.GetGuid(3);
        Guid knowledgeAreaId = reader.IsDBNull(4) ? Guid.Empty : reader.GetGuid(4);
        Guid categoryId = reader.IsDBNull(5) ? Guid.Empty : reader.GetGuid(5);
        string title = reader.IsDBNull(6) ? string.Empty : reader.GetString(6);
        string? shortDescription = reader.IsDBNull(7) ? null : reader.GetString(7);
        string modality = reader.IsDBNull(8) ? string.Empty : reader.GetString(8);
        string? learningLevel = reader.IsDBNull(9) ? null : reader.GetString(9);
        string status = reader.IsDBNull(10) ? string.Empty : reader.GetString(10);
        DateOnly? plannedProductionStartsOn = reader.IsDBNull(11) ? null : reader.GetFieldValue<DateOnly>(11);
        DateOnly? plannedProductionEndsOn = reader.IsDBNull(12) ? null : reader.GetFieldValue<DateOnly>(12);
        DateOnly? plannedTrackStartsOn = reader.IsDBNull(13) ? null : reader.GetFieldValue<DateOnly>(13);
        DateOnly? plannedTrackEndsOn = reader.IsDBNull(14) ? null : reader.GetFieldValue<DateOnly>(14);
        DateTimeOffset? registrationStartsAt = reader.IsDBNull(15) ? null : reader.GetFieldValue<DateTimeOffset>(15);
        DateTimeOffset? registrationEndsAt = reader.IsDBNull(16) ? null : reader.GetFieldValue<DateTimeOffset>(16);
        int onlineWorkloadMinutes = reader.IsDBNull(17) ? 0 : reader.GetInt32(17);
        int inPersonWorkloadMinutes = reader.IsDBNull(18) ? 0 : reader.GetInt32(18);
        int totalWorkloadMinutes = reader.IsDBNull(19) ? 0 : reader.GetInt32(19);
        int? plannedCapacity = reader.IsDBNull(20) ? null : reader.GetInt32(20);
        string? targetAudience = reader.IsDBNull(21) ? null : reader.GetString(21);
        string? prerequisites = reader.IsDBNull(22) ? null : reader.GetString(22);
        decimal? attendanceRequirementPercent = reader.IsDBNull(23) ? null : reader.GetDecimal(23);
        Guid createdByUserId = reader.IsDBNull(24) ? Guid.Empty : reader.GetGuid(24);
        DateTimeOffset createdAt = reader.IsDBNull(25) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(25);
        DateTimeOffset updatedAt = reader.IsDBNull(26) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(26);
        DateTimeOffset? cancelledAt = reader.IsDBNull(27) ? null : reader.GetFieldValue<DateTimeOffset>(27);

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

    public async Task<Track> CreateAsync(
        string? code,
        Guid? ideaId,
        Guid? sourceTrackId,
        Guid knowledgeAreaId,
        Guid categoryId,
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
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO tracks (
                code, idea_id, source_track_id, knowledge_area_id, category_id, title, short_description,
                modality, learning_level, planned_production_starts_on, planned_production_ends_on,
                planned_track_starts_on, planned_track_ends_on, registration_starts_at, registration_ends_at,
                online_workload_minutes, in_person_workload_minutes, planned_capacity, target_audience,
                prerequisites, attendance_requirement_percent, created_by_user_id
            )
            VALUES (
                @code, @ideaId, @sourceTrackId, @knowledgeAreaId, @categoryId, @title, @shortDescription,
                @modality, @learningLevel, @plannedProductionStartsOn, @plannedProductionEndsOn,
                @plannedTrackStartsOn, @plannedTrackEndsOn, @registrationStartsAt, @registrationEndsAt,
                @onlineWorkloadMinutes, @inPersonWorkloadMinutes, @plannedCapacity, @targetAudience,
                @prerequisites, @attendanceRequirementPercent, @createdByUserId
            )
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("code", (object?)code ?? DBNull.Value);
        cmd.Parameters.AddWithValue("ideaId", (object?)ideaId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("sourceTrackId", (object?)sourceTrackId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("knowledgeAreaId", knowledgeAreaId);
        cmd.Parameters.AddWithValue("categoryId", categoryId);
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
