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
					// quem emite e quem valida é o mesmo servidor: sem a tolerância padrão de 5 min, o token expira no horário do exp
					ClockSkew = TimeSpan.Zero,

                    RoleClaimType = ClaimTypes.Role,
                };	
			});
		services.AddAuthorization();

		return services;
	}

	public const string FrontendCorsPolicy = "Frontend";

	// Origens do front aceitas pelo CORS, em CORS_ALLOWED_ORIGINS (separadas por vírgula). Em
	// desenvolvimento, sem configuração, valem as portas padrão do Vite; fora dele, sem configuração
	// nenhuma origem externa é aceita (o Program avisa no log).
	public static string[] GetAllowedCorsOrigins(IConfiguration configuration, IHostEnvironment environment)
	{
		var origins = (configuration["CORS_ALLOWED_ORIGINS"] ?? string.Empty)
			.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
			.Select(origin => origin.TrimEnd('/')) // o navegador envia a origem sem a barra final
			.ToArray();

		if (origins.Contains("*"))
			throw new InvalidOperationException("CORS_ALLOWED_ORIGINS não aceita '*': informe as origens do front explicitamente.");

		if (origins.Length == 0 && environment.IsDevelopment())
		{
			return [
				"http://localhost:5173", "http://127.0.0.1:5173",
				"http://localhost:4173", "http://127.0.0.1:4173",
			];
		}

		return origins;
	}

	// Só o que o front usa: métodos GET/POST/PUT/DELETE e os cabeçalhos Authorization e Content-Type.
	// Sem AllowCredentials: o token vai no cabeçalho Authorization, não em cookie.
	public static IServiceCollection AddFrontendCors(
		this IServiceCollection services, string[] allowedOrigins)
	{
		services.AddCors(options =>
		{
			options.AddPolicy(FrontendCorsPolicy, policy =>
			{
				policy.WithOrigins(allowedOrigins)
					.WithMethods("GET", "POST", "PUT", "DELETE")
					.WithHeaders("Authorization", "Content-Type");
			});
		});

		return services;
	}
}
