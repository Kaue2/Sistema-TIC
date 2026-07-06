using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SistemaTic.Application.Services;

namespace SistemaTic.Application;

public static class DependencyInjection
{
	public static IServiceCollection AddApplication(
		this IServiceCollection services)
	{
		services.AddScoped<UserService>();
		return services;
	}
}
