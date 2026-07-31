using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;
using SistemaTic.Application.DTO;

namespace SistemaTic.Application.Services;

public class UserService
{
	private readonly IUserRepository _userRepository;
	private readonly IUserCredentialsRepository _userCredentialsRepository;

	public UserService(
		IUserRepository userRepository, 
		IUserCredentialsRepository userCredentialsRepository)
	{
		this._userRepository = userRepository;
		this._userCredentialsRepository = userCredentialsRepository;
	}

	public async Task<IEnumerable<User>> GetAllUsersAsync()
	{
		return await this._userRepository.GetAllUsersAsync();	
	}

	public async Task<Guid> CreateUser(CreateUserDTO dto)
	{
		return await _userRepository.CreateUserAsync(dto);
	}

	public async Task<UserCredentials> ChangeUserPasswordAsync(ChangeUserPasswordDTO dto)
	{
		User? user = await this._userRepository.GetUserByEmailAsync(dto.Email);

		if (user == null)
			throw new Exception("não foi possível encontrar o usuario");

		UserCredentials? credentials = await this._userCredentialsRepository.GetUserCredentialsAsync(user.Id);

		if (credentials == null)
			throw new Exception("não foi possível encontrar a credencial para o usuário");

        bool correct_password = BCrypt.Net.BCrypt.Verify(dto.OldPAssword, credentials.PasswordHash);

        if (!correct_password)
            throw new Exception("a senha do usuário está incorreta");

		var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

		credentials.PasswordHash = passwordHash;
		credentials.IsTemporary = false;
		credentials.PasswordChangedAt = DateTimeOffset.Now.ToUniversalTime();

		UserCredentials? newCredentials = await this._userCredentialsRepository.UpdateUserCredentialsAsync(credentials);

		if (newCredentials == null)
			throw new Exception("erro ao atualizar credenciais");

		return newCredentials;
    } 

	public async Task<User> ChangeUserRoleAsync(ChangeUserRoleDTO dto)
	{
		User? user = await this._userRepository.GetUserByEmailAsync(dto.Email);

		if (user is null)
			throw new Exception("não foi possivel encontrar o usuário");

		User? updatedUser = await this._userRepository.ChangeUserRoleAsync(user.Id, dto.RoleCode);

		if (updatedUser is null)
			throw new Exception("falha ao atualizar usuario");

		return updatedUser;
	}
}
