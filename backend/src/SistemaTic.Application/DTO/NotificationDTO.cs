namespace SistemaTic.Application.DTO;

public record NotificationProjection(
    Guid Id,
    string NotificationType,
    string Title,
    string? Message,
    DateTimeOffset CreatedAt,
    string? CreatedByName,
    DateTimeOffset? ReadAt,
    Guid? TrackId,
    string? TrackCode,
    string? TrackTitle,
    string? TrackModality,
    string? TrackStatus,
    DateOnly? TrackStartsOn,
    string? KnowledgeAreaName,
    Guid? TrackDocumentId,
    string? DocumentStatus,
    string? DocumentTemplateName,
    string? DocumentTemplateCode,
    Guid? TrackTaskId,
    string? TaskTitle,
    string? TaskStatus);

public record NotificationTargetDTO(
    string Kind,
    string Icon,
    string Title,
    string Identifier,
    string Subtitle,
    string Description,
    string Status,
    string StatusTone,
    string Modality,
    string Semester,
    string Route);

public record NotificationDTO(
    Guid Id,
    string Type,
    string Title,
    string? Message,
    DateTimeOffset CreatedAt,
    string CreatedBy,
    bool IsRead,
    NotificationTargetDTO Target);