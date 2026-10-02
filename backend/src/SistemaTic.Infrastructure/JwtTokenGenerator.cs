using System.Globalization;
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
	private readonly TimeSpan _accessTokenLifetime;

	public JwtTokenGenerator(IConfiguration configuration)
	{
		_secret = configuration["JWT_SECRET"] ?? throw new Exception("secret jwt não configurado");

		// vida curta: o cliente renova com o refresh token. Configurável (em minutos) por JWT_ACCESS_TOKEN_MINUTES.
		var configuredMinutes = configuration["JWT_ACCESS_TOKEN_MINUTES"];
		var minutes = double.TryParse(configuredMinutes, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed) && parsed > 0
			? parsed
			: 30;
		_accessTokenLifetime = TimeSpan.FromMinutes(minutes);
	}

	public string Generate(Guid userId, string email, string role)
	{
		var claims = new []
		{
			new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
			new Claim(JwtRegisteredClaimNames.Email, email),
			new Claim("role", role),
		};

		var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
		var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

		var token = new JwtSecurityToken(
			claims: claims,
			expires: DateTime.UtcNow.Add(_accessTokenLifetime),
			signingCredentials: creds);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}
}
