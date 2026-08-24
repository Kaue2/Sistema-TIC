using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class TrackTeamMemberRepository : ITrackTeamMemberRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public TrackTeamMemberRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static TrackTeamMember Map(NpgsqlDataReader reader)
    {
        Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        Guid trackId = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
        Guid userId = reader.IsDBNull(2) ? Guid.Empty : reader.GetGuid(2);
        string responsibility = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
        bool isLead = reader.IsDBNull(4) ? false : reader.GetBoolean(4);
        DateOnly startsOn = reader.IsDBNull(5) ? DateOnly.MinValue : reader.GetFieldValue<DateOnly>(5);
        DateOnly? endsOn = reader.IsDBNull(6) ? null : reader.GetFieldValue<DateOnly>(6);
        Guid assignedByUserId = reader.IsDBNull(7) ? Guid.Empty : reader.GetGuid(7);
        DateTimeOffset createdAt = reader.IsDBNull(8) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(8);
        DateTimeOffset updatedAt = reader.IsDBNull(9) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(9);

        return new TrackTeamMember(id, trackId, userId, responsibility, isLead, startsOn, endsOn,
                                    assignedByUserId, createdAt, updatedAt);
    }

    public async Task<IEnumerable<TrackTeamMember>> GetByTrackIdAsync(Guid trackId)
    {
        List<TrackTeamMember> members = new List<TrackTeamMember>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM track_team_members WHERE track_id = @trackId");
        cmd.Parameters.AddWithValue("trackId", trackId);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            members.Add(Map(reader));
        }
        return members;
    }

    public async Task<TrackTeamMember> CreateAsync(
        Guid trackId,
        Guid userId,
        string responsibility,
        bool isLead,
        DateOnly? startsOn,
        Guid assignedByUserId)
    {
        // startsOn nulo deixa o banco usar o default (CURRENT_DATE)
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO track_team_members (track_id, user_id, responsibility, is_lead, starts_on, assigned_by_user_id)
            VALUES (@trackId, @userId, @responsibility, @isLead, COALESCE(@startsOn, CURRENT_DATE), @assignedByUserId)
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("trackId", trackId);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("responsibility", responsibility);
        cmd.Parameters.AddWithValue("isLead", isLead);
        cmd.Parameters.AddWithValue("startsOn", (object?)startsOn ?? DBNull.Value);
        cmd.Parameters.AddWithValue("assignedByUserId", assignedByUserId);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return Map(reader);
    }
}
