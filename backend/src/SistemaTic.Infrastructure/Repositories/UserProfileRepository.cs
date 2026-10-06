using Npgsql;
using NpgsqlTypes;
using SistemaTic.Application.Contracts;
using SistemaTic.Application.DTO;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly NpgsqlDataSource _dataSource;
    private readonly ICurrentUser _currentUser;
    public UserProfileRepository(NpgsqlDataSource dataSource, ICurrentUser currentUser)
    {
        this._dataSource = dataSource;
        this._currentUser = currentUser;
    }

    private static UserProfile Map(NpgsqlDataReader reader)
    {
        Guid userId = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
        string? preferredName = reader.IsDBNull(1) ? null : reader.GetString(1);
        Guid? photoFileId = reader.IsDBNull(2) ? null : reader.GetGuid(2);
        string? workLocation = reader.IsDBNull(3) ? null : reader.GetString(3);
        int? weeklyWorkloadMinutes = reader.IsDBNull(4) ? null : reader.GetInt32(4);
        string? biography = reader.IsDBNull(5) ? null : reader.GetString(5);
        string? lattesUrl = reader.IsDBNull(6) ? null : reader.GetString(6);
        DateTimeOffset createdAt = reader.IsDBNull(7) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(7);
        DateTimeOffset updatedAt = reader.IsDBNull(8) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(8);
        Guid? knowledgeAreaId = reader.IsDBNull(9) ? null : reader.GetGuid(9);
        string? curriculumUrl = reader.IsDBNull(10) ? null : reader.GetString(10);

        return new UserProfile(
            userId,
            preferredName,
            photoFileId,
            workLocation,
            weeklyWorkloadMinutes,
            biography,
            lattesUrl,
            curriculumUrl,
            createdAt,
            updatedAt,
            knowledgeAreaId
        );
    }

    public async Task<UserProfile?> GetByUserIdAsync(Guid userId)
    {
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM user_profiles WHERE user_id = @userId");
        cmd.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }

        return null;
    }

    public async Task<IReadOnlyDictionary<Guid, UserProfile>> GetByUserIdsAsync(IEnumerable<Guid> userIds)
    {
        Dictionary<Guid, UserProfile> byUser = new Dictionary<Guid, UserProfile>();
        Guid[] ids = userIds.Distinct().ToArray();
        if (ids.Length == 0)
            return byUser;

        await using var cmd = _dataSource.CreateCommand("SELECT * FROM user_profiles WHERE user_id = ANY(@userIds)");
        cmd.Parameters.Add(new NpgsqlParameter("userIds", NpgsqlDbType.Array | NpgsqlDbType.Uuid) { Value = ids });

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            UserProfile profile = Map(reader);
            byUser[profile.UserId] = profile;
        }
        return byUser;
    }

    public async Task<UserProfile> UpsertAsync(
        Guid userId,
        string? preferredName,
        Guid? photoFileId,
        string? workLocation,
        int? weeklyWorkloadMinutes,
        string? biography,
        string? lattesUrl,
        string? curriculumUrl,
        Guid? knowledgeAreaId)
    {
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO user_profiles (user_id, preferred_name, photo_file_id, work_location, weekly_workload_minutes, biography, lattes_url, curriculum_url, knowledge_area_id)
            VALUES (@userId, @preferredName, @photoFileId, @workLocation, @weeklyWorkloadMinutes, @biography, @lattesUrl, @curriculumUrl, @knowledgeAreaId)
            ON CONFLICT (user_id) DO UPDATE SET
                preferred_name = EXCLUDED.preferred_name,
                photo_file_id = EXCLUDED.photo_file_id,
                work_location = EXCLUDED.work_location,
                weekly_workload_minutes = EXCLUDED.weekly_workload_minutes,
                biography = EXCLUDED.biography,
                lattes_url = EXCLUDED.lattes_url,
                curriculum_url = EXCLUDED.curriculum_url,
                knowledge_area_id = EXCLUDED.knowledge_area_id,
                updated_at = clock_timestamp()
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("preferredName", (object?)preferredName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("photoFileId", (object?)photoFileId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("workLocation", (object?)workLocation ?? DBNull.Value);
        cmd.Parameters.AddWithValue("weeklyWorkloadMinutes", (object?)weeklyWorkloadMinutes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("biography", (object?)biography ?? DBNull.Value);
        cmd.Parameters.AddWithValue("lattesUrl", (object?)lattesUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("curriculumUrl", (object?)curriculumUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("knowledgeAreaId", (object?)knowledgeAreaId ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        return Map(reader);
    }

    public async Task UpdatePhotoFileIdAsync(Guid userId, Guid photoFileId)
    {
        await using var connection = await _dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsActorAsync(_currentUser.Id);

        await using var cmd = new NpgsqlCommand(
            "UPDATE user_profiles SET photo_file_id = @photoFileId, updated_at = clock_timestamp() WHERE user_id = @userId",
            connection,
            transaction);
        cmd.Parameters.AddWithValue("photoFileId", photoFileId);
        cmd.Parameters.AddWithValue("userId", userId);

        int affected = await cmd.ExecuteNonQueryAsync();
        if (affected == 0)
        {
            throw new Exception("perfil do usuário não encontrado");
        }

        await transaction.CommitAsync();
    }
}
