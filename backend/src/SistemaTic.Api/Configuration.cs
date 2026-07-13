using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace SistemaTic.Api;

public static class Configuration
{
	public static IServiceCollection AddJwtAuthentication(
		this IServiceCollection services, IConfiguration configuration)
	{
		string jwtSecret = configuration["JWT_SECRET"] ?? throw new InvalidOperationException("JWT_SECRET não configurado");

		services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
			.AddJwtBearer(options =>
			{
				options.TokenValidationParameters = new TokenValidationParameters
				{
					ValidateIssuerSigningKey = true,
					IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
					ValidateIssuer = false,
					ValidateAudience = false,
					ValidateLifetime = true,
				};	
			});
		services.AddAuthorization();

		return services;
	}
}
