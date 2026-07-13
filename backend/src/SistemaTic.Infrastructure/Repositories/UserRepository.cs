using Npgsql;
using SistemaTic.Application;
using SistemaTic.Application.DTO;
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
			reader.GetBoolean(5),
			reader.GetInt32(6),
			reader.GetFieldValue<DateTimeOffset>(7),
			reader.IsDBNull(8) ? null : reader.GetFieldValue<DateTimeOffset>(8)));		
		}
		return users;
	}

	public async Task<User?> GetByEmailAsync(string email)
	{
		User user;
		await using var cmd = _dataSource.CreateCommand("""
			SELECT * FROM users WHERE email = @email
		""");
		cmd.Parameters.AddWithValue("email", email);
		Console.WriteLine($"Texto do comando: {cmd.CommandText}");
		await using var reader = await cmd.ExecuteReaderAsync();
		if (await reader.ReadAsync())
		{
			user = new User(
				reader.GetInt32(0),
				reader.GetString(1),
				reader.GetString(2),
				reader.GetString(3),
				reader.GetBoolean(4),
				reader.GetBoolean(5),
				reader.GetInt16(6),
				reader.GetFieldValue<DateTimeOffset>(7),
				reader.IsDBNull(6) ? null : reader.GetFieldValue<DateTimeOffset>(8));

			return user;
		}

		return null;
	}

	public async Task<string> GetUserRoleAsync(int userId)
	{
		string role;
		await using var cmd = _dataSource.CreateCommand("""
			SELECT roles.name FROM users
			INNER JOIN roles ON users.role_id = roles.role_id
			WHERE users.user_id = @id			
		""");
		cmd.Parameters.AddWithValue("id", userId);
		
		await using var reader = await cmd.ExecuteReaderAsync();
		await reader.ReadAsync();
		return reader.GetString(0);
	}

	public async Task<int> CreateUserAsync(UserDTO dto)
	{
		var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);

		await using var cmd = _dataSource.CreateCommand("""
			INSERT INTO users (name, email, hashed_password, active, change_password, role_id, created_at, updated_at)
			VALUES (@name, @email, @hashedPassword, true, true, @roleId, @createdAt, @updatedAt)
			RETURNING user_id
		""");

		cmd.Parameters.AddWithValue("name", dto.Name);
        cmd.Parameters.AddWithValue("email", dto.Email);
        cmd.Parameters.AddWithValue("hashedPassword", hashedPassword);
        cmd.Parameters.AddWithValue("roleId", 1);
        cmd.Parameters.AddWithValue("createdAt", DateTimeOffset.UtcNow);
        cmd.Parameters.AddWithValue("updatedAt", DateTimeOffset.UtcNow);

		var result = await cmd.ExecuteScalarAsync();
		int id = (int)result;
		return id;
	}
}
