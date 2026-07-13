using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Services;

public class AuthService
{
	private readonly IUserRepository _userRepository;
	private readonly ITokenGenerator _tokenGenerator;

	public AuthService(IUserRepository userRepository, ITokenGenerator tokenGenerator)
	{
		this._userRepository = userRepository;
		this._tokenGenerator = tokenGenerator;
	}

	public async Task<string?> AuthenticateAsync(string email, string password)
	{
		User? user = await this._userRepository.GetByEmailAsync(email);

		if (user is null)
			throw new Exception("Não foi possível encontrar o usuário.");

		var correct_password = BCrypt.Net.BCrypt.Verify(password, user.Hashed_password);		

		string role = await this._userRepository.GetUserRoleAsync(user.Id);
		
		return this._tokenGenerator.Generate(user.Id, user.Email, role);		
	}
}
