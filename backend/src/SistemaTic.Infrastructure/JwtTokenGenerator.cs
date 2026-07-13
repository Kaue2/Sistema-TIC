using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SistemaTic.Application.Contracts;

namespace SistemaTic.Infrastructure;

public class JwtTokenGenerator : ITokenGenerator
{
	private readonly string _secret;

	public JwtTokenGenerator(IConfiguration configuration)
	{
		_secret = configuration["JWT_SECRET"] ?? throw new Exception("secret jwt não configurado");	
	}

	public string Generate(int userId, string email, string role)
	{
		var claims = new []
		{
			new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
			new Claim(JwtRegisteredClaimNames.Email, email),
			new Claim(ClaimTypes.Role, role),
		};

		var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
		var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

		var token = new JwtSecurityToken(
			claims: claims,
			expires: DateTime.UtcNow.AddDays(1),
			signingCredentials: creds);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}
}
