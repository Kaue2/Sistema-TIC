using Npgsql;
using NpgsqlTypes;
using SistemaTic.Application;
using SistemaTic.Application.DTO;
using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;
using SistemaTic.Domain;

namespace SistemaTic.Infrastructure;

public class UserRepository : IUserRepository
{
    private readonly NpgsqlDataSource _dataSource;
    private readonly ICurrentUser _currentUser;
    public UserRepository(NpgsqlDataSource dataSource, ICurrentUser currentUser)
    {
        this._dataSource = dataSource;
        this._currentUser = currentUser;
    }

    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        List<User> users = new List<User>();
        await using var cmd = _dataSource.CreateCommand("SELECT * FROM users");
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
            Guid role_id = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
            string email = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
            string name = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
            string status = reader.IsDBNull(4) ? string.Empty : reader.GetString(4);
            Guid createdByUser = reader.IsDBNull(5) ? Guid.Empty : reader.GetGuid(5);
            DateTimeOffset createdAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);
            DateTimeOffset updatedAt = reader.IsDBNull(7) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(7);
            DateTimeOffset disabledAt = reader.IsDBNull(8) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(8);

            User user = new User(id, role_id, email, name, status, createdByUser, createdAt, updatedAt, disabledAt);

            users.Add(user);
        }
        return users;
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        User user;

        await using var cmd = _dataSource.CreateCommand("""
			SELECT * FROM users WHERE email = @email
		""");

        cmd.Parameters.AddWithValue("email", email);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
            Guid role_id = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
            string emailDatabase = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
            string name = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
            string status = reader.IsDBNull(4) ? string.Empty : reader.GetString(4);
            Guid createdByUser = reader.IsDBNull(5) ? Guid.Empty : reader.GetGuid(5);
            DateTimeOffset createdAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);
            DateTimeOffset updatedAt = reader.IsDBNull(7) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(7);
            DateTimeOffset disabledAt = reader.IsDBNull(8) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(8);

            user = new User(id, role_id, emailDatabase, name, status, createdByUser, createdAt, updatedAt, disabledAt);

            return user;
        }

        return null;
    }

    public async Task<User?> GetUserByIdAsync(Guid id)
    {
        await using var cmd = _dataSource.CreateCommand("""
			SELECT * FROM users WHERE id = @id
		""");

        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            Guid userId = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
            Guid roleId = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
            string email = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
            string name = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
            string status = reader.IsDBNull(4) ? string.Empty : reader.GetString(4);
            Guid? createdByUser = reader.IsDBNull(5) ? null : reader.GetGuid(5);
            DateTimeOffset createdAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);
            DateTimeOffset updatedAt = reader.IsDBNull(7) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(7);
            DateTimeOffset? disabledAt = reader.IsDBNull(8) ? null : reader.GetFieldValue<DateTimeOffset>(8);

            return new User(userId, roleId, email, name, status, createdByUser, createdAt, updatedAt, disabledAt);
        }

        return null;
    }

    public async Task<Roles?> GetUserRoleAsync(Guid userId)
    {
        Roles role;
        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
        SELECT 
            roles.id, 
            roles.code, 
            roles.name, 
            roles.hierarchy_level, 
            roles.description, 
            roles.is_active, 
            roles.created_at 
        FROM users 
        INNER JOIN roles ON users.role_id = roles.id
        WHERE users.id = @userId
        """;

        cmd.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
            string code = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
            string name = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
            short hierarchyLevel = reader.IsDBNull(3) ? (short)0 : reader.GetInt16(3);
            string? description = reader.IsDBNull(4) ? null : reader.GetString(4);
            bool isActive = reader.IsDBNull(5) ? false : reader.GetBoolean(5);
            DateTimeOffset createdAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);

            role = new Roles(id, code, name, hierarchyLevel, description, isActive, createdAt);
            return role;
        }

        return null;
    }

    public async Task<IReadOnlyDictionary<Guid, Roles>> GetUserRolesAsync(IEnumerable<Guid> userIds)
    {
        Dictionary<Guid, Roles> byUser = new Dictionary<Guid, Roles>();
        Guid[] ids = userIds.Distinct().ToArray();
        if (ids.Length == 0)
            return byUser;

        await using var cmd = _dataSource.CreateCommand();
        cmd.CommandText = """
            SELECT users.id,
                   roles.id,
                   roles.code,
                   roles.name,
                   roles.hierarchy_level,
                   roles.description,
                   roles.is_active,
                   roles.created_at
            FROM users
            INNER JOIN roles ON users.role_id = roles.id
            WHERE users.id = ANY(@userIds)
            """;

        cmd.Parameters.Add(new NpgsqlParameter("userIds", NpgsqlDbType.Array | NpgsqlDbType.Uuid) { Value = ids });

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            Guid userId = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
            Guid id = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
            string code = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
            string name = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
            short hierarchyLevel = reader.IsDBNull(4) ? (short)0 : reader.GetInt16(4);
            string? description = reader.IsDBNull(5) ? null : reader.GetString(5);
            bool isActive = reader.IsDBNull(6) ? false : reader.GetBoolean(6);
            DateTimeOffset createdAt = reader.IsDBNull(7) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(7);

            byUser[userId] = new Roles(id, code, name, hierarchyLevel, description, isActive, createdAt);
        }
        return byUser;
    }

    public async Task<Guid> CreateUserAsync(
        string fullName,
        string emailEducacional,
        Guid roleId,
        string temporaryPassword,
        string administrativeEmail,
        IReadOnlyCollection<UserAvailabilitySummaryDTO> availability,
        string? workLocation,
        int weeklyWorkloadMinutes)
    {
        // senha chega em texto puro e sai como hash; usuário nasce com senha temporária,
        // então é obrigado a trocar no primeiro acesso (bate com o CHECK do banco).
        // O hash (lento de propósito) é calculado antes de abrir a transação.
        string passwordHash = BCrypt.Net.BCrypt.HashPassword(temporaryPassword);

        // usuário, credenciais, contato, disponibilidade e perfil nascem juntos:
        // se qualquer insert falhar, nada fica gravado.
        await using var connection = await this._dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsActorAsync(this._currentUser.Id);

        try
        {
            Guid userId;
            await using (var cmdUser = connection.CreateCommand())
            {
                cmdUser.Transaction = transaction;
                cmdUser.CommandText = """
                INSERT INTO users (full_name, email, role_id, status)
                VALUES (@fullName, @email, @roleId, 'active')
                RETURNING id;
                """;

                cmdUser.Parameters.AddWithValue("fullName", fullName);
                cmdUser.Parameters.AddWithValue("email", emailEducacional);
                cmdUser.Parameters.AddWithValue("roleId", roleId);

                var result = await cmdUser.ExecuteScalarAsync();

                if (result is null)
                    throw new InvalidOperationException("Falha ao gerar o ID do usuário no banco de dados.");

                userId = (Guid)result;
            }

            await using (var cmdCredentials = connection.CreateCommand())
            {
                cmdCredentials.Transaction = transaction;
                cmdCredentials.CommandText = """
                INSERT INTO user_credentials (user_id, password_hash, is_temporary, must_change_password, temporary_password_expires_at)
                VALUES (@userId, @passwordHash, true, true, @tempExpiresAt);
                """;
                cmdCredentials.Parameters.AddWithValue("userId", userId);
                cmdCredentials.Parameters.AddWithValue("passwordHash", passwordHash);
                cmdCredentials.Parameters.AddWithValue("tempExpiresAt", DateTimeOffset.UtcNow.AddDays(7));
                await cmdCredentials.ExecuteNonQueryAsync();
            }

            await using (var cmdContact = connection.CreateCommand())
            {
                cmdContact.Transaction = transaction;
                cmdContact.CommandText = """
                INSERT INTO user_contacts (user_id, contact_type, contact_value, label, is_primary)
                VALUES (@userId, 'email', @contactValue, 'Email Administrativo', true);
                """;
                cmdContact.Parameters.AddWithValue("userId", userId);
                cmdContact.Parameters.AddWithValue("contactValue", administrativeEmail);
                await cmdContact.ExecuteNonQueryAsync();
            }

            foreach (var slot in availability)
            {
                // não manda "timezone": a coluna já tem default 'America/Sao_Paulo' no banco
                await using var cmdAvailability = connection.CreateCommand();
                cmdAvailability.Transaction = transaction;
                cmdAvailability.CommandText = """
                INSERT INTO user_availability (user_id, weekday, starts_at, ends_at)
                VALUES (@userId, @weekday, @startsAt, @endsAt);
                """;
                cmdAvailability.Parameters.AddWithValue("userId", userId);
                cmdAvailability.Parameters.AddWithValue("weekday", slot.Weekday);
                cmdAvailability.Parameters.Add(new NpgsqlParameter("startsAt", NpgsqlDbType.Time) { Value = slot.StartsAt });
                cmdAvailability.Parameters.Add(new NpgsqlParameter("endsAt", NpgsqlDbType.Time) { Value = slot.EndsAt });
                await cmdAvailability.ExecuteNonQueryAsync();
            }

            await using (var cmdProfile = connection.CreateCommand())
            {
                cmdProfile.Transaction = transaction;
                cmdProfile.CommandText = """
                INSERT INTO user_profiles (user_id, work_location, weekly_workload_minutes)
                VALUES (@userId, @workLocation, @weeklyWorkloadMinutes);
                """;
                cmdProfile.Parameters.AddWithValue("userId", userId);
                cmdProfile.Parameters.AddWithValue("workLocation", (object?)workLocation ?? DBNull.Value);
                cmdProfile.Parameters.AddWithValue("weeklyWorkloadMinutes", weeklyWorkloadMinutes);
                await cmdProfile.ExecuteNonQueryAsync();
            }

            await transaction.CommitAsync();

            return userId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<User?> ChangeUserRoleAsync(Guid userId, string roleCode)
    {
        var cmdRole = this._dataSource.CreateCommand();
        cmdRole.CommandText = """
            SELECT id FROM roles WHERE code = @code
        """;
        cmdRole.Parameters.AddWithValue("code", roleCode);

        var roleResult = await cmdRole.ExecuteScalarAsync();

        if (roleResult is null)
        {
            throw new Exception("Não foi possível encontrar a role solicitada.");
        }

        Guid roleId = (Guid)roleResult;

        await using var connection = await this._dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsActorAsync(this._currentUser.Id);

        await using var cmdUser = connection.CreateCommand();
        cmdUser.Transaction = transaction;
        cmdUser.CommandText = """
            UPDATE users
        SET
            role_id = @roleId
        WHERE id = @userId
        RETURNING id, 
                  role_id, 
                  email, 
                  full_name, 
                  status, 
                  created_by_user_id, 
                  created_at, 
                  updated_at, 
                  disabled_at
        """;

        cmdUser.Parameters.AddWithValue("roleId", roleId);
        cmdUser.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmdUser.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
            Guid roleIdDatabase = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
            string email = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
            string name = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
            string status = reader.IsDBNull(4) ? string.Empty : reader.GetString(4);
            Guid? createdByUser = reader.IsDBNull(5) ? null : reader.GetGuid(5);
            DateTimeOffset createdAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);
            DateTimeOffset updatedAt = reader.IsDBNull(7) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(7);
            DateTimeOffset? disabledAt = reader.IsDBNull(8) ? null : reader.GetFieldValue<DateTimeOffset>(8);

            var updatedUser = new User(
                id,
                roleIdDatabase,
                email,
                name,
                status,
                createdByUser,
                createdAt,
                updatedAt,
                disabledAt
            );

            await reader.CloseAsync();
            await transaction.CommitAsync();

            return updatedUser;
        }

        return null;
    }

    public async Task<User?> UpdateUserAsync(User user)
    {

        await using var cmd = this._dataSource.CreateCommand();
        cmd.CommandText =
       """
        UPDATE users
        SET 
            full_name = @fullName,
            email = @email,
            status = @status,
            disabled_at = CASE 
                            WHEN @status = 'disabled' THEN COALESCE(disabled_at, clock_timestamp())
                            ELSE NULL
                          END
        WHERE id = @id
        RETURNING id, 
                  role_id, 
                  email, 
                  full_name, 
                  status, 
                  created_by_user_id, 
                  created_at, 
                  updated_at, 
                  disabled_at;
        """;

        cmd.Parameters.AddWithValue("id", user.Id);
        cmd.Parameters.AddWithValue("fullName", user.Name);
        cmd.Parameters.AddWithValue("email", user.Email);
        cmd.Parameters.AddWithValue("status", user.Status);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            Guid id = reader.IsDBNull(0) ? Guid.Empty : reader.GetGuid(0);
            Guid roleId = reader.IsDBNull(1) ? Guid.Empty : reader.GetGuid(1);
            string email = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
            string name = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
            string status = reader.IsDBNull(4) ? string.Empty : reader.GetString(4);
            Guid? createdByUser = reader.IsDBNull(5) ? null : reader.GetGuid(5);
            DateTimeOffset createdAt = reader.IsDBNull(6) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(6);
            DateTimeOffset updatedAt = reader.IsDBNull(7) ? DateTimeOffset.MinValue : reader.GetFieldValue<DateTimeOffset>(7);
            DateTimeOffset? disabledAt = reader.IsDBNull(8) ? null : reader.GetFieldValue<DateTimeOffset>(8);

            var updatedUser = new User(
                id,
                roleId,
                email,
                name,
                status,
                createdByUser,
                createdAt,
                updatedAt,
                disabledAt
            );

            return updatedUser;
        }

        return null;
    }
}
