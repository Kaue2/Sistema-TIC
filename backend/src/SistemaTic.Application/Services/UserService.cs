using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Services;

public class UserService
{
	private readonly IUserRepository _userRepository;

	public UserService(IUserRepository userRepository)
	{
		this._userRepository = userRepository;
	}

	public async Task<IEnumerable<User>> GetAllUsersAsync()
	{
		return await this._userRepository.GetAllUsersAsync();	
	}
}
