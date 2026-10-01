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
    private readonly IFileAssetRepository _fileAssetRepository;
    private readonly IUserPhotoStorage _userPhotoStorage;
    private readonly ITrackTeamMemberRepository _trackTeamMemberRepository;
    private readonly ITrackRepository _trackRepository;

    private static readonly string[] AllowedPhotoMediaTypes = { "image/jpeg", "image/png", "image/webp" };
    private const long MaxPhotoSizeBytes = 5 * 1024 * 1024;

    public UserService(
        IUserRepository userRepository,
        IUserCredentialsRepository userCredentialsRepository,
        IUserAvailabilityRepository userAvailabilityRepository,
        IRoleRepository roleRepository,
        IUserContactRepository userContactRepository,
        IUserProfileRepository userProfileRepository,
        IFileAssetRepository fileAssetRepository,
        IUserPhotoStorage userPhotoStorage,
        ITrackTeamMemberRepository trackTeamMemberRepository,
        ITrackRepository trackRepository)
    {
        this._userRepository = userRepository;
        this._userCredentialsRepository = userCredentialsRepository;
        this._userAvailabilityRepository = userAvailabilityRepository;
        this._roleRepository = roleRepository;
        this._userContactRepository = userContactRepository;
        this._userProfileRepository = userProfileRepository;
        this._fileAssetRepository = fileAssetRepository;
        this._userPhotoStorage = userPhotoStorage;
        this._trackTeamMemberRepository = trackTeamMemberRepository;
        this._trackRepository = trackRepository;
    }

    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        return await this._userRepository.GetAllUsersAsync();
    }

    public async Task<IEnumerable<MemberSummaryDTO>> GetMembersAsync()
    {
        var users = (await this._userRepository.GetAllUsersAsync()).ToList();
        Guid[] userIds = users.Select(u => u.Id).ToArray();

        var roles = await this._userRepository.GetUserRolesAsync(userIds);
        var profiles = await this._userProfileRepository.GetByUserIdsAsync(userIds);
        var contacts = await this._userContactRepository.GetByUserIdsAsync(userIds);
        var availability = await this._userAvailabilityRepository.GetByUserIdsAsync(userIds);

        return users.Select(user =>
        {
            Roles? role = roles.GetValueOrDefault(user.Id);
            UserProfile? profile = profiles.GetValueOrDefault(user.Id);
            var userContacts = contacts.GetValueOrDefault(user.Id) ?? new List<UserContact>();
            var userAvailability = availability.GetValueOrDefault(user.Id) ?? new List<UserAvailability>();
            string? administrativeEmail = userContacts.FirstOrDefault(c => c.IsPrimary)?.ContactValue;

            return new MemberSummaryDTO(
                user.Id,
                user.Name,
                role?.Code ?? string.Empty,
                user.Email,
                administrativeEmail,
                profile?.WorkLocation,
                userAvailability.Select(a => new UserAvailabilitySummaryDTO(a.Weekday, a.StartsAt, a.EndsAt))
            );
        });
    }

    public async Task<MemberEditDTO> GetMemberForEditAsync(Guid id)
    {
        User? user = await this._userRepository.GetUserByIdAsync(id);
        if (user is null)
            throw new Exception("não foi possível encontrar o usuário");

        Roles? role = await this._userRepository.GetUserRoleAsync(id);
        UserProfile? profile = await this._userProfileRepository.GetByUserIdAsync(id);
        var contacts = await this._userContactRepository.GetByUserIdAsync(id);
        var availability = await this._userAvailabilityRepository.GetByUserIdAsync(id);
        var trackIds = await this._trackTeamMemberRepository.GetActiveTrackIdsByUserIdAsync(id);
        string? administrativeEmail = contacts
            .FirstOrDefault(c => c.ContactType == "email" && c.IsPrimary)
            ?.ContactValue;

        return new MemberEditDTO(
            user.Id,
            user.Name,
            role?.Code ?? string.Empty,
            user.Email,
            administrativeEmail,
            profile?.WorkLocation,
            profile?.WeeklyWorkloadMinutes,
            availability.Select(a => new UserAvailabilitySummaryDTO(a.Weekday, a.StartsAt, a.EndsAt)),
            trackIds
        );
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
            profile?.CurriculumUrl,
            contacts.Select(c => new UserContactSummaryDTO(c.ContactType, c.ContactValue, c.Label, c.IsPrimary)),
            availability.Select(a => new UserAvailabilitySummaryDTO(a.Weekday, a.StartsAt, a.EndsAt))
        );
    }

    public async Task UpdateProfileLinksAsync(Guid userId, string? curriculumUrl, string? lattesUrl)
    {
        User? user = await this._userRepository.GetUserByIdAsync(userId);
        if (user is null)
            throw new Exception("não foi possível encontrar o usuário");

        UserProfile? profile = await this._userProfileRepository.GetByUserIdAsync(userId);

        await this._userProfileRepository.UpsertAsync(
            userId,
            preferredName: profile?.PreferredName,
            photoFileId: profile?.PhotoFileId,
            workLocation: profile?.WorkLocation,
            weeklyWorkloadMinutes: profile?.WeeklyWorkloadMinutes,
            biography: profile?.Biography,
            lattesUrl: string.IsNullOrWhiteSpace(lattesUrl) ? null : lattesUrl,
            curriculumUrl: string.IsNullOrWhiteSpace(curriculumUrl) ? null : curriculumUrl,
            knowledgeAreaId: profile?.KnowledgeAreaId);
    }

    public async Task<Guid> CreateUser(CreateUserDTO dto)
    {
        if (!int.TryParse(dto.TotalHours, out int hours) || hours <= 0)
            throw new Exception("É necessário informar a carga horária semanal do usuário");

        bool hasSchedule = dto.Schedule.Any(s => !string.IsNullOrWhiteSpace(s.Start) && !string.IsNullOrWhiteSpace(s.End));
        if (!hasSchedule)
            throw new Exception("É necessário informar ao menos um dia de disponibilidade do usuário");

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
        string? workLocation = string.IsNullOrWhiteSpace(dto.Location) ? null : dto.Location;

        await _userProfileRepository.UpsertAsync(
            userId,
            preferredName: null,
            photoFileId: null,
            workLocation: workLocation,
            weeklyWorkloadMinutes: hours * 60,
            biography: null,
            lattesUrl: null,
            curriculumUrl: null,
            knowledgeAreaId: null);

        return userId;
    }

    public async Task UpdateMemberAsync(Guid userId, UpdateMemberDTO dto, Guid updatedByUserId)
    {
        var parsedSchedule = new List<(short Weekday, TimeOnly StartsAt, TimeOnly EndsAt)>();
        foreach (var schedule in dto.Schedule)
        {
            if (string.IsNullOrWhiteSpace(schedule.Start) || string.IsNullOrWhiteSpace(schedule.End))
                continue;

            if (!UserAvailability.WeekdayMap.TryGetValue(schedule.Day, out short weekday))
                throw new Exception($"Dia da semana inválido: {schedule.Day}");

            if (!TimeOnly.TryParse(schedule.Start, out TimeOnly startsAt) ||
                !TimeOnly.TryParse(schedule.End, out TimeOnly endsAt) || startsAt >= endsAt)
            {
                throw new Exception($"Horário inválido para {schedule.Day}");
            }

            parsedSchedule.Add((weekday, startsAt, endsAt));
        }

        if (parsedSchedule.Count == 0)
            throw new Exception("É necessário informar ao menos um dia de disponibilidade do usuário");

        int weeklyWorkloadMinutes = parsedSchedule
            .Sum(item => (int)(item.EndsAt - item.StartsAt).TotalMinutes);

        Roles? role = await this._roleRepository.GetByCodeAsync(dto.RoleCode);
        if (role is null)
            throw new Exception("Role informada não encontrada");

        User? user = await this._userRepository.GetUserByIdAsync(userId);
        if (user is null)
            throw new Exception("não foi possível encontrar o usuário");

        User? userWithSameEmail = await this._userRepository.GetUserByEmailAsync(dto.EmailEducacional);
        if (userWithSameEmail is not null && userWithSameEmail.Id != userId)
            throw new Exception("já existe um usuário com este e-mail educacional");

        Guid[] desiredTrackIdsToValidate = dto.TrackIds.Distinct().ToArray();
        foreach (Guid trackId in desiredTrackIdsToValidate)
        {
            Track? track = await this._trackRepository.GetByIdAsync(trackId);
            if (track is null)
                throw new Exception($"trilha não encontrada: {trackId}");
        }

        user.Name = dto.Name;
        user.Email = dto.EmailEducacional;

        User? updatedUser = await this._userRepository.UpdateUserAsync(user);
        if (updatedUser is null)
            throw new Exception("falha ao atualizar usuário");

        User? roleUpdatedUser = await this._userRepository.ChangeUserRoleAsync(userId, dto.RoleCode);
        if (roleUpdatedUser is null)
            throw new Exception("falha ao atualizar função do usuário");

        if (string.IsNullOrWhiteSpace(dto.EmailAdministrativo))
        {
            await this._userContactRepository.ClearPrimaryAsync(userId, "email");
        }
        else
        {
            await this._userContactRepository.UpsertPrimaryAsync(
                userId,
                "email",
                dto.EmailAdministrativo,
                "Email Administrativo");
        }

        UserProfile? profile = await this._userProfileRepository.GetByUserIdAsync(userId);
        string? workLocation = string.IsNullOrWhiteSpace(dto.Location) ? null : dto.Location;

        await this._userProfileRepository.UpsertAsync(
            userId,
            preferredName: profile?.PreferredName,
            photoFileId: profile?.PhotoFileId,
            workLocation: workLocation,
            weeklyWorkloadMinutes: weeklyWorkloadMinutes,
            biography: profile?.Biography,
            lattesUrl: profile?.LattesUrl,
            curriculumUrl: profile?.CurriculumUrl,
            knowledgeAreaId: profile?.KnowledgeAreaId);

        var currentAvailability = await this._userAvailabilityRepository.GetByUserIdAsync(userId);
        foreach (UserAvailability availability in currentAvailability)
        {
            await this._userAvailabilityRepository.DeleteAsync(availability.Id);
        }

        foreach (var schedule in parsedSchedule)
        {
            await this._userAvailabilityRepository.CreateAsync(
                userId, schedule.Weekday, schedule.StartsAt, schedule.EndsAt);
        }

        HashSet<Guid> desiredTrackIds = desiredTrackIdsToValidate.ToHashSet();
        var activeMemberships = (await this._trackTeamMemberRepository.GetActiveByUserIdAsync(userId)).ToList();
        HashSet<Guid> keptTrackIds = new HashSet<Guid>();

        foreach (TrackTeamMember membership in activeMemberships)
        {
            if (desiredTrackIds.Contains(membership.TrackId) && membership.Responsibility == dto.RoleCode)
            {
                keptTrackIds.Add(membership.TrackId);
                continue;
            }

            await this._trackTeamMemberRepository.EndAsync(membership.Id);
        }

        foreach (Guid trackId in desiredTrackIds.Except(keptTrackIds))
        {
            await this._trackTeamMemberRepository.CreateAsync(
                trackId,
                userId,
                dto.RoleCode,
                isLead: false,
                startsOn: null,
                assignedByUserId: updatedByUserId);
        }
    }

    public async Task UploadUserPhotoAsync(Guid userId, Stream content, string fileName, string? contentType, long length, Guid uploadedByUserId)
    {
        User? user = await this._userRepository.GetUserByIdAsync(userId);
        if (user is null)
            throw new Exception("não foi possível encontrar o usuário");

        if (length <= 0)
            throw new Exception("arquivo de foto não enviado");

        if (length > MaxPhotoSizeBytes)
            throw new Exception("a foto excede o tamanho máximo permitido (5MB)");

        if (contentType is null || !AllowedPhotoMediaTypes.Contains(contentType))
            throw new Exception("formato de foto não suportado, use JPEG, PNG ou WEBP");

        UserProfile? profile = await this._userProfileRepository.GetByUserIdAsync(userId);
        FileAsset? existingAsset = profile?.PhotoFileId is Guid existingId
            ? await this._fileAssetRepository.GetByIdAsync(existingId)
            : null;

        string storageKey = await this._userPhotoStorage.SaveAsync(userId, content, fileName);

        if (existingAsset is not null)
        {
            if (existingAsset.StorageKey is not null && existingAsset.StorageKey != storageKey)
                this._userPhotoStorage.DeleteIfExists(existingAsset.StorageKey);

            await this._fileAssetRepository.UpdateAsync(existingAsset.Id, storageKey, fileName, contentType, length);
        }
        else
        {
            FileAsset asset = await this._fileAssetRepository.CreateAsync("local", storageKey, fileName, contentType, length, uploadedByUserId);
            await this._userProfileRepository.UpdatePhotoFileIdAsync(userId, asset.Id);
        }
    }

    public async Task<(Stream Content, string MediaType, string FileName)?> GetUserPhotoAsync(Guid userId)
    {
        UserProfile? profile = await this._userProfileRepository.GetByUserIdAsync(userId);
        if (profile?.PhotoFileId is not Guid photoFileId)
            return null;

        FileAsset? asset = await this._fileAssetRepository.GetByIdAsync(photoFileId);
        if (asset?.StorageKey is null)
            return null;

        Stream? content = await this._userPhotoStorage.OpenAsync(asset.StorageKey);
        if (content is null)
            return null;

        return (content, asset.MediaType ?? "application/octet-stream", asset.OriginalFileName);
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
        credentials.FailedAttempts = 0;
        credentials.LockedUntil = null;
        credentials.TemporaryPasswordExpiresAt = null;

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
