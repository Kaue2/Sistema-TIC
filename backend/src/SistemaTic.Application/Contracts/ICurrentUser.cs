namespace SistemaTic.Application.Contracts;

// Usuário autenticado da requisição atual (claim do JWT). Id é nulo fora de uma requisição
// autenticada (login, refresh, seeds). É usado para informar o ator ao banco (app.current_user_id).
public interface ICurrentUser
{
    Guid? Id { get; }
}
