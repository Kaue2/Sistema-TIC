using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using SistemaTic.Application.Contracts;
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
            throw new Exception("Não foi possível encontrar o usuário.");

        UserCredentials? credentials = await this._userCredentialsRepository.GetUserCredentialsAsync(user.Id);

        if (credentials is null)
            throw new Exception("Não foi possível encontrar as credenciais do usuário");

        bool correct_password = BCrypt.Net.BCrypt.Verify(password, credentials.PasswordHash);

        if (!correct_password)
            throw new Exception("a senha do usuário está incorreta");

        Roles? role = await this._userRepository.GetUserRoleAsync(user.Id);

        if (role is null)
            throw new Exception("Não foi possível encontrar a role do usuário");

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
