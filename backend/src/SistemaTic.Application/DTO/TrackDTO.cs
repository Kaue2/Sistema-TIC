namespace SistemaTic.Application.DTO;

public record CreateTrackDTO(
    Guid? SourceTrackId,
    Guid KnowledgeAreaId,
    Guid? CategoryId,
    string Title,
    string? ShortDescription,
    string Modality,
    string? LearningLevel,
    DateOnly? PlannedProductionStartsOn,
    DateOnly? PlannedProductionEndsOn,
    DateOnly? PlannedTrackStartsOn,
    DateOnly? PlannedTrackEndsOn,
    DateTimeOffset? RegistrationStartsAt,
    DateTimeOffset? RegistrationEndsAt,
    int OnlineWorkloadMinutes,
    int InPersonWorkloadMinutes,
    int? PlannedCapacity,
    string? TargetAudience,
    string? Prerequisites,
    decimal? AttendanceRequirementPercent
);

public record CreateTrackTeamMemberDTO(
    Guid TrackId,
    Guid UserId,
    string Responsibility,
    bool IsLead,
    DateOnly? StartsOn
);
