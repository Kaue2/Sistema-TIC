using SistemaTic.Domain.Entities;
using SistemaTic.Application.DTO;
using SistemaTic.Domain;

namespace SistemaTic.Application.Contracts;

public interface IUserRepository
{
	public Task<IEnumerable<User>> GetAllUsersAsync();
	public Task<User?> GetUserByEmailAsync(string email);
	public Task<Roles?> GetUserRoleAsync(Guid userId);
    public Task<Guid> CreateUserAsync(CreateUserDTO dto);
	public Task<User?> UpdateUserAsync(User user);
	public Task<User?> ChangeUserRoleAsync(Guid user, string roleCode);
}
