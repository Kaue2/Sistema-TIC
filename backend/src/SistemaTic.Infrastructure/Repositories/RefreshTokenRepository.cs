using Npgsql;
using SistemaTic.Application.Contracts;

namespace SistemaTic.Infrastructure.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly NpgsqlDataSource _dataSource;
    public RefreshTokenRepository(NpgsqlDataSource dataSource)
    {
        this._dataSource = dataSource;
    }

    public async Task CreateAsync(Guid userId, string tokenHash, DateTimeOffset expiresAt)
    {
        await using var connection = await this._dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        await DeleteStaleTokensAsync(connection, transaction, userId);
        await InsertAsync(connection, transaction, userId, tokenHash, expiresAt);

        await transaction.CommitAsync();
    }

    public async Task<Guid?> RotateAsync(string oldTokenHash, string newTokenHash, DateTimeOffset newExpiresAt)
    {
        await using var connection = await this._dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        // o UPDATE condicional "consome" o token: duas renovações simultâneas com o mesmo token
        // não passam as duas (a segunda não encontra linha com revoked_at nulo).
        Guid userId;
        await using (var revokeCmd = new NpgsqlCommand("""
            UPDATE refresh_tokens
               SET revoked_at = clock_timestamp()
             WHERE token_hash = @tokenHash
               AND revoked_at IS NULL
               AND expires_at > clock_timestamp()
            RETURNING user_id;
        """, connection, transaction))
        {
            revokeCmd.Parameters.AddWithValue("tokenHash", oldTokenHash);
            var result = await revokeCmd.ExecuteScalarAsync();
            if (result is null)
                return null;
            userId = (Guid)result;
        }

        await DeleteStaleTokensAsync(connection, transaction, userId);
        await InsertAsync(connection, transaction, userId, newTokenHash, newExpiresAt);

        await transaction.CommitAsync();
        return userId;
    }

    public async Task RevokeAsync(string tokenHash)
    {
        await using var cmd = this._dataSource.CreateCommand("""
            UPDATE refresh_tokens
               SET revoked_at = clock_timestamp()
             WHERE token_hash = @tokenHash
               AND revoked_at IS NULL;
        """);
        cmd.Parameters.AddWithValue("tokenHash", tokenHash);
        await cmd.ExecuteNonQueryAsync();
    }

    private static async Task InsertAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction,
        Guid userId, string tokenHash, DateTimeOffset expiresAt)
    {
        await using var cmd = new NpgsqlCommand("""
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
            VALUES (@userId, @tokenHash, @expiresAt);
        """, connection, transaction);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("tokenHash", tokenHash);
        cmd.Parameters.AddWithValue("expiresAt", expiresAt.ToUniversalTime());
        await cmd.ExecuteNonQueryAsync();
    }

    // Limpeza oportunista: como cada renovação gera uma linha, apaga as do usuário que já
    // expiraram ou foram revogadas há mais de um dia.
    private static async Task DeleteStaleTokensAsync(
        NpgsqlConnection connection, NpgsqlTransaction transaction, Guid userId)
    {
        await using var cmd = new NpgsqlCommand("""
            DELETE FROM refresh_tokens
             WHERE user_id = @userId
               AND (expires_at < clock_timestamp() - interval '1 day'
                    OR revoked_at < clock_timestamp() - interval '1 day');
        """, connection, transaction);
        cmd.Parameters.AddWithValue("userId", userId);
        await cmd.ExecuteNonQueryAsync();
    }
}
