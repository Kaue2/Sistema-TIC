namespace SistemaTic.Application.DTO;

public record UpdateUserProfileDTO(
    string? PreferredName,
    Guid? PhotoFileId,
    string? WorkLocation,
    int? WeeklyWorkloadMinutes,
    string? Biography,
    string? LattesUrl,
    Guid? KnowledgeAreaId
);

public record UserContactDTO(
    string ContactType,
    string ContactValue,
    string? Label,
    bool IsPrimary
);

public record UserAvailabilityDTO(
    short Weekday,
    TimeOnly StartsAt,
    TimeOnly EndsAt,
    string? Timezone,
    DateOnly? ValidFrom,
    DateOnly? ValidUntil,
    string? Notes
);

public record AssignUserJobPositionDTO(
    Guid JobPositionId,
    DateOnly StartsOn,
    string? Notes
);
