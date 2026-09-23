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

    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan TemporaryPasswordLifetime = TimeSpan.FromDays(7);

    public AuthService(
        IUserRepository userRepository,
        ITokenGenerator tokenGenerator,
        IUserCredentialsRepository userCredentialsRepository)
    {
        this._userRepository = userRepository;
        this._tokenGenerator = tokenGenerator;
        this._userCredentialsRepository = userCredentialsRepository;
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
        AuthenticateResponseDTO dto = new AuthenticateResponseDTO(token, user.Email, user.Name, role.Code, credentials.MustChangePassword);
        return dto;
    }
}
