using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Npgsql;
using SistemaTic.Application.Contracts;

namespace SistemaTic.Infrastructure;

public static class DependencyInjection
{
	public static IServiceCollection AddInfrastructure(
		this IServiceCollection services,
		IConfiguration configuration)
	{
		var connectionString = BuildConnectionString(configuration);
		services.AddNpgsqlDataSource(connectionString);
		services.AddScoped<IUserRepository, UserRepository>();

		return services;
	}

	private static string BuildConnectionString(IConfiguration configuration)
	{
		var database = configuration["POSTGRES_DB"] ?? throw new Exception("POSTGRES_DB não configurado");
		var user = configuration["POSTGRES_USER"] ?? throw new Exception("POSTGRES_USER não configurado");
		var password = configuration["POSTGRES_PASSWORD"] ?? throw new Exception("POSTGRES_PASSWORD não configurado");

		return $"Host=localhost;Port=5432;Database={database};Username={user};Password={password}";
		
	}
}
