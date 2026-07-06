using Npgsql;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Infrastructure;

public class UserRepository : IUserRepository
{
	private readonly NpgsqlDataSource _dataSource;
	public UserRepository(NpgsqlDataSource dataSource)
	{
		this._dataSource = dataSource;
	}

	public async Task<IEnumerable<User>> GetAllUsersAsync()
	{
		List<User> users = new List<User>();
		await using var cmd = _dataSource.CreateCommand("SELECT * FROM users");
		await using var reader = await cmd.ExecuteReaderAsync();
		while (await reader.ReadAsync())
		{
			users.Add(new User(
			reader.GetInt32(0),
			reader.GetString(1),
			reader.GetString(2),
			reader.GetString(3),
			reader.GetBoolean(4),
			reader.GetFieldValue<DateTimeOffset>(5),
			reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(6)));		
		}
		return users;
	}
}
