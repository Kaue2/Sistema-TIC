using SistemaTic.Domain.Entities;
using SistemaTic.Application.DTO;

namespace SistemaTic.Application.Contracts;

public interface IUserRepository
{
	public Task<IEnumerable<User>> GetAllUsersAsync();
	public Task<User?> GetByEmailAsync(string email);
	public Task<string> GetUserRoleAsync(int userId);
	public Task<int> CreateUserAsync(UserDTO dto);
}
