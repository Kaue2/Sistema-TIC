using Npgsql;

namespace SistemaTic.Infrastructure;

internal static class ActorTransaction
{
    // Abre a transação já informando ao banco quem é o autor da operação (app.current_user_id), que
    // current_actor_id() lê para a auditoria e para os guards. is_local = true: vale só até o fim
    // da transação e nunca vaza para a próxima requisição que reusar a conexão do pool.
    // Sem ator (null), nada é setado e o banco registra a operação sem autor.
    public static async Task<NpgsqlTransaction> BeginTransactionAsActorAsync(
        this NpgsqlConnection connection, Guid? actorId, CancellationToken cancellationToken = default)
    {
        var transaction = await connection.BeginTransactionAsync(cancellationToken);

        if (actorId is not null)
        {
            await using var cmd = new NpgsqlCommand(
                "SELECT set_config('app.current_user_id', @userId, true);", connection, transaction);
            cmd.Parameters.AddWithValue("userId", actorId.Value.ToString());
            await cmd.ExecuteScalarAsync(cancellationToken);
        }

        return transaction;
    }
}
