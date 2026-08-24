namespace SistemaTic.Application.DTO;

public record MemberScheduleItemDTO(string Day, string Start, string End);
public record CreateUserDTO(
    string Name,
    string EmailEducacional,
    string EmailAdministrativo,
    string RoleCode,
    string TotalHours,
    string Location,
    List<MemberScheduleItemDTO> Schedule
);
public record ChangeUserPasswordDTO(string OldPassword, string NewPassword, string ConfirmNewPassword);
public record ChangeUserRoleDTO(string Email, string RoleCode);

public record UserContactSummaryDTO(string ContactType, string ContactValue, string? Label, bool IsPrimary);
public record UserAvailabilitySummaryDTO(short Weekday, TimeOnly StartsAt, TimeOnly EndsAt);

public record UserProfileResponseDTO(
    Guid Id,
    string Name,
    string Email,
    string? RoleName,
    string? WorkLocation,
    int? WeeklyWorkloadMinutes,
    string? LattesUrl,
    IEnumerable<UserContactSummaryDTO> Contacts,
    IEnumerable<UserAvailabilitySummaryDTO> Availability
);

public record MemberSummaryDTO(
    Guid Id,
    string FullName,
    string RoleCode,
    string InstitutionalEmail,
    string? AdministrativeEmail,
    string? WorkLocation,
    IEnumerable<UserAvailabilitySummaryDTO> Availability
);
