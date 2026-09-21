using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure.Repositories;

public class FileAssetRepository : IFileAssetRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public FileAssetRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    private static FileAsset Map(NpgsqlDataReader reader)
    {
        Guid id = reader.GetGuid(0);
        string provider = reader.GetString(1);
        string? storageKey = reader.IsDBNull(2) ? null : reader.GetString(2);
        string? externalUrl = reader.IsDBNull(3) ? null : reader.GetString(3);
        string originalFileName = reader.GetString(4);
        string? mediaType = reader.IsDBNull(5) ? null : reader.GetString(5);
        long? sizeBytes = reader.IsDBNull(6) ? null : reader.GetInt64(6);
        string? sha256 = reader.IsDBNull(7) ? null : reader.GetString(7);
        Guid? uploadedByUserId = reader.IsDBNull(8) ? null : reader.GetGuid(8);
        DateTimeOffset createdAt = reader.GetFieldValue<DateTimeOffset>(9);
        DateTimeOffset? deletedAt = reader.IsDBNull(10) ? null : reader.GetFieldValue<DateTimeOffset>(10);

        return new FileAsset(id, provider, storageKey, externalUrl, originalFileName, mediaType,
            sizeBytes, sha256, uploadedByUserId, createdAt, deletedAt);
    }

    public async Task<FileAsset?> GetByIdAsync(Guid id)
    {
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM file_assets WHERE id = @id");
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return Map(reader);
        }

        return null;
    }

    public async Task<FileAsset> CreateAsync(
        string provider,
        string? storageKey,
        string originalFileName,
        string? mediaType,
        long? sizeBytes,
        Guid? uploadedByUserId)
    {
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            INSERT INTO file_assets (provider, storage_key, original_file_name, media_type, size_bytes, uploaded_by_user_id)
            VALUES (@provider, @storageKey, @originalFileName, @mediaType, @sizeBytes, @uploadedByUserId)
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("provider", provider);
        cmd.Parameters.AddWithValue("storageKey", (object?)storageKey ?? DBNull.Value);
        cmd.Parameters.AddWithValue("originalFileName", originalFileName);
        cmd.Parameters.AddWithValue("mediaType", (object?)mediaType ?? DBNull.Value);
        cmd.Parameters.AddWithValue("sizeBytes", (object?)sizeBytes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("uploadedByUserId", (object?)uploadedByUserId ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        return Map(reader);
    }

    public async Task<FileAsset> UpdateAsync(
        Guid id,
        string? storageKey,
        string originalFileName,
        string? mediaType,
        long? sizeBytes)
    {
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            UPDATE file_assets SET
                storage_key = @storageKey,
                original_file_name = @originalFileName,
                media_type = @mediaType,
                size_bytes = @sizeBytes
            WHERE id = @id
            RETURNING *;
        """;

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("storageKey", (object?)storageKey ?? DBNull.Value);
        cmd.Parameters.AddWithValue("originalFileName", originalFileName);
        cmd.Parameters.AddWithValue("mediaType", (object?)mediaType ?? DBNull.Value);
        cmd.Parameters.AddWithValue("sizeBytes", (object?)sizeBytes ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        return Map(reader);
    }
}
