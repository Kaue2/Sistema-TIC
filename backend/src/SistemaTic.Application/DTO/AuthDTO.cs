namespace SistemaTic.Application.DTO;

public record AuthenticateUserDTO(string Email, string Password);
public record AuthenticateResponseDTO(string Token, string Email, string Name, string RoleName, bool MustChangePassword, string RefreshToken);
public record RefreshTokenRequestDTO(string RefreshToken);
public record RefreshResponseDTO(string Token, string RefreshToken);
