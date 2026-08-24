using SistemaTic.Domain.Entities;
using SistemaTic.Application.DTO;
using SistemaTic.Domain;

namespace SistemaTic.Application.Contracts;

public interface IUserRepository
{
    public Task<IEnumerable<User>> GetAllUsersAsync();
    public Task<User?> GetUserByEmailAsync(string email);
    public Task<User?> GetUserByIdAsync(Guid id);
    public Task<Roles?> GetUserRoleAsync(Guid userId);
    public Task<Guid> CreateUserAsync(string fullName, string emailEducacional, Guid roleId);
    public Task<User?> UpdateUserAsync(User user);
    public Task<User?> ChangeUserRoleAsync(Guid user, string roleCode);
}
