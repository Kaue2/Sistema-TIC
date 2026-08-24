using SistemaTic.Application.Contracts;
using SistemaTic.Domain.Entities;
using SistemaTic.Application.DTO;

namespace SistemaTic.Application.Services;

public class UserService
{
    private readonly IUserRepository _userRepository;
    private readonly IUserCredentialsRepository _userCredentialsRepository;
    private readonly IUserAvailabilityRepository _userAvailabilityRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IUserContactRepository _userContactRepository;
    private readonly IUserProfileRepository _userProfileRepository;

    public UserService(
        IUserRepository userRepository,
        IUserCredentialsRepository userCredentialsRepository,
        IUserAvailabilityRepository userAvailabilityRepository,
        IRoleRepository roleRepository,
        IUserContactRepository userContactRepository,
        IUserProfileRepository userProfileRepository)
    {
        this._userRepository = userRepository;
        this._userCredentialsRepository = userCredentialsRepository;
        this._userAvailabilityRepository = userAvailabilityRepository;
        this._roleRepository = roleRepository;
        this._userContactRepository = userContactRepository;
        this._userProfileRepository = userProfileRepository;
    }

    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        return await this._userRepository.GetAllUsersAsync();
    }

    public async Task<IEnumerable<MemberSummaryDTO>> GetMembersAsync()
    {
        var users = await this._userRepository.GetAllUsersAsync();
        var members = new List<MemberSummaryDTO>();

        foreach (var user in users)
        {
            Roles? role = await this._userRepository.GetUserRoleAsync(user.Id);
            UserProfile? profile = await this._userProfileRepository.GetByUserIdAsync(user.Id);
            var contacts = await this._userContactRepository.GetByUserIdAsync(user.Id);
            var availability = await this._userAvailabilityRepository.GetByUserIdAsync(user.Id);
            string? administrativeEmail = contacts.FirstOrDefault(c => c.IsPrimary)?.ContactValue;

            members.Add(new MemberSummaryDTO(
                user.Id,
                user.Name,
                role?.Code ?? string.Empty,
                user.Email,
                administrativeEmail,
                profile?.WorkLocation,
                availability.Select(a => new UserAvailabilitySummaryDTO(a.Weekday, a.StartsAt, a.EndsAt))
            ));
        }

        return members;
    }

    public async Task<UserProfileResponseDTO> GetUserProfileAsync(Guid id)
    {
        User? user = await this._userRepository.GetUserByIdAsync(id);
        if (user is null)
            throw new Exception("não foi possível encontrar o usuário");

        Roles? role = await this._userRepository.GetUserRoleAsync(id);
        UserProfile? profile = await this._userProfileRepository.GetByUserIdAsync(id);
        var contacts = await this._userContactRepository.GetByUserIdAsync(id);
        var availability = await this._userAvailabilityRepository.GetByUserIdAsync(id);

        return new UserProfileResponseDTO(
            user.Id,
            user.Name,
            user.Email,
            role?.Name,
            profile?.WorkLocation,
            profile?.WeeklyWorkloadMinutes,
            profile?.LattesUrl,
            contacts.Select(c => new UserContactSummaryDTO(c.ContactType, c.ContactValue, c.Label, c.IsPrimary)),
            availability.Select(a => new UserAvailabilitySummaryDTO(a.Weekday, a.StartsAt, a.EndsAt))
        );
    }

    public async Task<Guid> CreateUser(CreateUserDTO dto)
    {
        Roles? role = await _roleRepository.GetByCodeAsync(dto.RoleCode);
        if (role is null)
            throw new Exception("Role informada não encontrada");

        Guid userId = await _userRepository.CreateUserAsync(dto.Name, dto.EmailEducacional, role.Id);
        UserCredentials credentials = await _userCredentialsRepository.CreateAsync(userId, "senha123");
        UserContact contact = await _userContactRepository.CreateAsync(userId, "email", dto.EmailAdministrativo, "Email Administrativo", true);

        foreach (var schedule in dto.Schedule)
        {
            // dia de folga vem com start/end vazios no front, então só pula
            if (string.IsNullOrWhiteSpace(schedule.Start) || string.IsNullOrWhiteSpace(schedule.End))
                continue;

            short weekday = UserAvailability.WeekdayMap[schedule.Day];
            TimeOnly startsAt = TimeOnly.Parse(schedule.Start);
            TimeOnly endsAt = TimeOnly.Parse(schedule.End);

            await _userAvailabilityRepository.CreateAsync(userId, weekday, startsAt, endsAt);
        }

        // front manda a jornada em horas (string); o banco guarda minutos
        int? weeklyWorkloadMinutes = int.TryParse(dto.TotalHours, out int hours) ? hours * 60 : null;
        string? workLocation = string.IsNullOrWhiteSpace(dto.Location) ? null : dto.Location;

        await _userProfileRepository.UpsertAsync(
            userId,
            preferredName: null,
            photoFileId: null,
            workLocation: workLocation,
            weeklyWorkloadMinutes: weeklyWorkloadMinutes,
            biography: null,
            lattesUrl: null,
            knowledgeAreaId: null);

        return userId;
    }

    public async Task<UserCredentials> ChangeUserPasswordAsync(string email, string oldPassword, string newPassword, string confirmNewPassword)
    {
        User? user = await this._userRepository.GetUserByEmailAsync(email);

        if (user == null)
            throw new Exception("não foi possível encontrar o usuario");

        UserCredentials? credentials = await this._userCredentialsRepository.GetUserCredentialsAsync(user.Id);

        if (credentials == null)
            throw new Exception("não foi possível encontrar a credencial para o usuário");

        bool correct_password = BCrypt.Net.BCrypt.Verify(oldPassword, credentials.PasswordHash);

        if (!correct_password)
            throw new Exception("a senha do usuário está incorreta");

        if (!String.Equals(newPassword, confirmNewPassword))
            throw new Exception("a nova senha e a confirmação não são iguais");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

        credentials.PasswordHash = passwordHash;
        credentials.IsTemporary = false;
        credentials.PasswordChangedAt = DateTimeOffset.Now.ToUniversalTime();
        credentials.MustChangePassword = false;

        UserCredentials? newCredentials = await this._userCredentialsRepository.UpdateUserCredentialsAsync(credentials);

        if (newCredentials == null)
            throw new Exception("erro ao atualizar credenciais");

        return newCredentials;
    }

    public async Task<User> ChangeUserRoleAsync(ChangeUserRoleDTO dto)
    {
        User? user = await this._userRepository.GetUserByEmailAsync(dto.Email);

        if (user is null)
            throw new Exception("não foi possivel encontrar o usuário");

        User? updatedUser = await this._userRepository.ChangeUserRoleAsync(user.Id, dto.RoleCode);

        if (updatedUser is null)
            throw new Exception("falha ao atualizar usuario");

        return updatedUser;
    }
}
