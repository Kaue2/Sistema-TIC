using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Services;

public class AuthService
{
	private readonly IUserRepository _userRepository;
	private readonly ITokenGenerator _tokenGenerator;
	private readonly IUserCredentialsRepository _userCredentialsRepository;

	public AuthService(
		IUserRepository userRepository, 
		ITokenGenerator tokenGenerator, 
		IUserCredentialsRepository userCredentialsRepository)
	{
		this._userRepository = userRepository;
		this._tokenGenerator = tokenGenerator;
		this._userCredentialsRepository = userCredentialsRepository;
	}

	public async Task<string?> AuthenticateAsync(string email, string password)
	{
		User? user = await this._userRepository.GetUserByEmailAsync(email);

		if (user is null)
			throw new Exception("Não foi possível encontrar o usuário.");

		UserCredentials? credentials = await this._userCredentialsRepository.GetUserCredentialsAsync(user.Id);

		if (credentials is null)
			throw new Exception("Não foi possível encontrar as credenciais do usuário");

		bool correct_password = BCrypt.Net.BCrypt.Verify(password, credentials.PasswordHash);		

		if (!correct_password)
            throw new Exception("a senha do usuário está incorreta");

        Roles? role = await this._userRepository.GetUserRoleAsync(user.Id);

		if (role is null)
			throw new Exception("Não foi possível encontrar a role do usuário");
		
		return this._tokenGenerator.Generate(user.Id, user.Email, role.Code);
	}
}
