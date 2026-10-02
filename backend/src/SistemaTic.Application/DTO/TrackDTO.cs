using System.Text.Json;

namespace SistemaTic.Application.DTO;

public record CreateTrackDTO(
    Guid? SourceTrackId,
    Guid KnowledgeAreaId,
    Guid? CategoryId,
    string Title,
    string Semester,
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

public record TrackMentorSummaryDTO(string FullName, string Email);

public record TrackSummaryDTO(
    Guid Id,
    int Code,
    string Title,
    string Semester,
    string Modality,
    string? LearningLevel,
    string Status,
    string KnowledgeAreaName,
    IEnumerable<TrackMentorSummaryDTO> Mentors
);

public record TrackDocumentSummaryDTO(
    Guid Id,
    string DocumentType,
    int TrackCode,
    string TrackTitle,
    string Semester,
    string KnowledgeAreaName,
    string Status
);

public record TrackDocumentContentDTO(
    Guid Id,
    string DocumentType,
    string Status,
    JsonElement Content,
    string? DevolveObservation
);

public record DevolveTrackDocumentDTO(string? Observation);

public record DocumentosTrilhaDTO(
    TrackDocumentSummaryDTO? EscopoPropostaDaTrilha,
    TrackDocumentSummaryDTO? PlanoEnsinoDaTrilha,
    TrackDocumentSummaryDTO? SoftexDaTrilha
);

public record CreateTrackTeamMemberDTO(
    Guid TrackId,
    Guid UserId,
    string Responsibility,
    bool IsLead,
    DateOnly? StartsOn
);

public record SoftexDocumentDTO(Guid Id, string Status);
