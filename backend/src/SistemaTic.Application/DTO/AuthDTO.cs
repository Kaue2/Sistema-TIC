namespace SistemaTic.Application.DTO;

using SistemaTic.Domain.Entities;

public record AuthDTO(string Token, string Email, string Name, string RoleName, bool MustChangePassword);
