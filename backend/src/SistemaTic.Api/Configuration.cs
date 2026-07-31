using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

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

                    RoleClaimType = ClaimTypes.Role,
                };	
			});
		services.AddAuthorization();

		return services;
	}
}
