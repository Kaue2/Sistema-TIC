using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface IUserRepository
{
	public Task<IEnumerable<User>> GetAllUsersAsync();
}
