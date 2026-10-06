namespace SistemaTic.Application.Contracts;

public interface IRefreshTokenRepository
{
    public Task CreateAsync(Guid userId, string tokenHash, DateTimeOffset expiresAt);

    // Troca atômica: invalida o token informado (se ainda válido) e grava o novo.
    // Devolve o dono do token, ou null se ele não existe, já foi usado/revogado ou expirou.
    public Task<Guid?> RotateAsync(string oldTokenHash, string newTokenHash, DateTimeOffset newExpiresAt);

    public Task RevokeAsync(string tokenHash);
}
