namespace SistemaTic.Application.DTO;

public record CreateUserDTO(string Name, string Email, string Password, string roleCode);
public record CreateUserTokenDTO(string Email, string Password);
public record ChangeUserPasswordDTO(string Email, string OldPAssword, string NewPassword);
public record ChangeUserRoleDTO(string Email, string RoleCode);