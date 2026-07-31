using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace SistemaTic.Infrastructure.Repositories;

public class UserCredentialsRepository : IUserCredentialsRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public UserCredentialsRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;   
    }

    public async Task<UserCredentials?> GetUserCredentialsAsync(Guid userId)
    {
        UserCredentials credentials;
        var cmd = this._dataSource.CreateCommand("SELECT * FROM user_credentials WHERE user_id = @id");
        cmd.Parameters.AddWithValue("id", userId);

        using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
            string passwordHash = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
            bool isTemporary = reader.IsDBNull(2) ? false : reader.GetBoolean(2);
            bool mustChangePassword = reader.IsDBNull(3) ? false : reader.GetBoolean(3);
            DateTimeOffset? tempExpiresAt = reader.IsDBNull(4) ? null : reader.GetFieldValue<DateTimeOffset>(4);
            DateTimeOffset? passwordChangedAt = reader.IsDBNull(5) ? null : reader.GetFieldValue<DateTimeOffset>(5);
            int failedAttempts = reader.IsDBNull(6) ? 0 : reader.GetInt32(6);
            DateTimeOffset? lockedUntil = reader.IsDBNull(7) ? null : reader.GetFieldValue<DateTimeOffset>(7);
            DateTimeOffset updatedAt = reader.IsDBNull(8) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(8);

            credentials = new UserCredentials(
                id,
                passwordHash,
                isTemporary,
                mustChangePassword,
                tempExpiresAt,
                passwordChangedAt,
                failedAttempts,
                lockedUntil,
                updatedAt
            );

            return credentials;
        }

        return null;
    }

    public async Task<UserCredentials?> UpdateUserCredentialsAsync(UserCredentials credentials)
    {
        await using var cmd = this._dataSource.CreateCommand();
        cmd.CommandText = """
        UPDATE user_credentials
        SET 
            password_hash = @passwordHash,
            is_temporary = @isTemporary,
            must_change_password = @mustChangePassword,
            password_changed_at = @passwordChangedAt
        WHERE user_id = @userId
        RETURNING user_id, 
                  password_hash, 
                  is_temporary, 
                  must_change_password, 
                  temporary_password_expires_at, 
                  password_changed_at, 
                  failed_attempts, 
                  locked_until, 
                  updated_at;
        """;

        cmd.Parameters.AddWithValue("userId", credentials.UserId);
        cmd.Parameters.AddWithValue("passwordHash", credentials.PasswordHash);
        cmd.Parameters.AddWithValue("isTemporary", credentials.IsTemporary);
        cmd.Parameters.AddWithValue("mustChangePassword", credentials.MustChangePassword);
        cmd.Parameters.AddWithValue("passwordChangedAt", credentials.PasswordChangedAt.Value.ToUniversalTime());


        await using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            Guid userId = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
            string passwordHash = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
            bool isTemporary = reader.IsDBNull(2) ? false : reader.GetBoolean(2);
            bool mustChangePassword = reader.IsDBNull(3) ? false : reader.GetBoolean(3);
            DateTimeOffset? tempExpiresAt = reader.IsDBNull(4) ? null : reader.GetFieldValue<DateTimeOffset>(4);
            DateTimeOffset? passwordChangedAt = reader.IsDBNull(5) ? null : reader.GetFieldValue<DateTimeOffset>(5);
            int failedAttempts = reader.IsDBNull(6) ? 0 : reader.GetInt32(6);
            DateTimeOffset? lockedUntil = reader.IsDBNull(7) ? null : reader.GetFieldValue<DateTimeOffset>(7);
            DateTimeOffset updatedAt = reader.IsDBNull(8) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(8);

            var updatedCredentials = new UserCredentials(
                userId,
                passwordHash,
                isTemporary,
                mustChangePassword,
                tempExpiresAt,
                passwordChangedAt,
                failedAttempts,
                lockedUntil,
                updatedAt
            );

            return updatedCredentials;
        }

        return null;
    }
}
