namespace SistemaTic.Application.DTO;

public record CreateUserDTO(string Name, string Email, string Password, string roleCode);
public record ChangeUserPasswordDTO(string OldPassword, string NewPassword, string ConfirmNewPassword);
public record ChangeUserRoleDTO(string Email, string RoleCode);
