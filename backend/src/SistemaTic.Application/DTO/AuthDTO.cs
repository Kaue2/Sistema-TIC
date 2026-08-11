namespace SistemaTic.Application.DTO;

public record AuthenticateUserDTO(string Email, string Password);
public record AuthenticateResponseDTO(string Token, string Email, string Name, string RoleName, bool MustChangePassword);
