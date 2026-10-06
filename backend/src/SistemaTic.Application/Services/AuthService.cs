using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using SistemaTic.Application.Contracts;
using SistemaTic.Application.Exceptions;
using SistemaTic.Domain.Entities;
using SistemaTic.Application.DTO;

namespace SistemaTic.Application.Services;

public class AuthService
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenGenerator _tokenGenerator;
    private readonly IUserCredentialsRepository _userCredentialsRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;

    // O access token (JWT) tem vida curta; o refresh token mantém a sessão por até 7 dias
    // e é renovado (rotação) a cada uso, então a sessão só expira após 7 dias sem uso.
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);

    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan TemporaryPasswordLifetime = TimeSpan.FromDays(7);

    public AuthService(
        IUserRepository userRepository,
        ITokenGenerator tokenGenerator,
        IUserCredentialsRepository userCredentialsRepository,
        IRefreshTokenRepository refreshTokenRepository)
    {
        this._userRepository = userRepository;
        this._tokenGenerator = tokenGenerator;
        this._userCredentialsRepository = userCredentialsRepository;
        this._refreshTokenRepository = refreshTokenRepository;
    }

    public async Task<AuthenticateResponseDTO> AuthenticateAsync(string email, string password)
    {
        User? user = await this._userRepository.GetUserByEmailAsync(email);

        if (user is null)
            throw new AuthenticationException("E-mail ou senha inválidos.");

        if (user.Status == "disabled")
            throw new AuthenticationException("Conta desabilitada.");

        UserCredentials? credentials = await this._userCredentialsRepository.GetUserCredentialsAsync(user.Id);

        if (credentials is null)
            throw new AuthenticationException("E-mail ou senha inválidos.");

        DateTimeOffset now = DateTimeOffset.UtcNow;

        if (credentials.LockedUntil is DateTimeOffset lockedUntil && lockedUntil > now)
            throw new AuthenticationException("Conta temporariamente bloqueada. Tente novamente mais tarde.");

        if (credentials.IsTemporary &&
            credentials.TemporaryPasswordExpiresAt is DateTimeOffset tempExpiresAt &&
            tempExpiresAt <= now)
        {
            throw new AuthenticationException("A senha temporária expirou. Solicite uma nova senha.");
        }

        bool correct_password = BCrypt.Net.BCrypt.Verify(password, credentials.PasswordHash);

        if (!correct_password)
        {
            credentials.FailedAttempts += 1;

            if (credentials.FailedAttempts >= MaxFailedAttempts)
            {
                credentials.FailedAttempts = 0;
                credentials.LockedUntil = now.Add(LockoutDuration);
            }

            await this._userCredentialsRepository.UpdateUserCredentialsAsync(credentials);

            throw new AuthenticationException("E-mail ou senha inválidos.");
        }

        if (credentials.FailedAttempts > 0 || credentials.LockedUntil is not null)
        {
            credentials.FailedAttempts = 0;
            credentials.LockedUntil = null;
            await this._userCredentialsRepository.UpdateUserCredentialsAsync(credentials);
        }

        Roles? role = await this._userRepository.GetUserRoleAsync(user.Id);

        if (role is null)
            throw new AuthenticationException("Não foi possível autenticar o usuário.");

        string token = this._tokenGenerator.Generate(user.Id, user.Email, role.Code);

        string refreshToken = GenerateRefreshToken();
        await this._refreshTokenRepository.CreateAsync(user.Id, HashRefreshToken(refreshToken), DateTimeOffset.UtcNow.Add(RefreshTokenLifetime));

        AuthenticateResponseDTO dto = new AuthenticateResponseDTO(token, user.Email, user.Name, role.Code, credentials.MustChangePassword, refreshToken);
        return dto;
    }

    // Troca um refresh token válido por um novo par (access + refresh). Devolve null quando o
    // token é inválido, expirou, já foi usado ou o usuário não está mais ativo.
    public async Task<RefreshResponseDTO?> RefreshAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return null;

        string newRefreshToken = GenerateRefreshToken();
        Guid? userId = await this._refreshTokenRepository.RotateAsync(
            HashRefreshToken(refreshToken),
            HashRefreshToken(newRefreshToken),
            DateTimeOffset.UtcNow.Add(RefreshTokenLifetime));

        if (userId is null)
            return null;

        User? user = await this._userRepository.GetUserByIdAsync(userId.Value);
        Roles? role = await this._userRepository.GetUserRoleAsync(userId.Value);

        if (user is null || role is null || user.Status != "active")
        {
            await this._refreshTokenRepository.RevokeAsync(HashRefreshToken(newRefreshToken));
            return null;
        }

        // e-mail e papel vêm do banco, então mudanças de papel valem a partir da próxima renovação
        string token = this._tokenGenerator.Generate(user.Id, user.Email, role.Code);
        return new RefreshResponseDTO(token, newRefreshToken);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return;

        await this._refreshTokenRepository.RevokeAsync(HashRefreshToken(refreshToken));
    }

    private static string GenerateRefreshToken()
    {
        return Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(32));
    }

    // só o hash fica no banco; quem tem acesso ao banco não consegue usar os tokens
    private static string HashRefreshToken(string refreshToken)
    {
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
    }
}
