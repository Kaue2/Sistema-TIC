using SistemaTic.Application.Contracts;
using SistemaTic.Application.DTO;

namespace SistemaTic.Application.Services;

public class NotificationService
{
    private readonly INotificationRepository _notificationRepository;

    public NotificationService(INotificationRepository notificationRepository)
    {
        this._notificationRepository = notificationRepository;
    }

    public async Task<IReadOnlyList<NotificationDTO>> GetNotificationsAsync(Guid userId)
    {
        var projections = await this._notificationRepository.GetByRecipientAsync(userId);
        return projections.Select(Map).ToArray();
    }

    public async Task<bool> MarkReadAsync(Guid userId, Guid notificationId)
    {
        return await this._notificationRepository.MarkReadAsync(userId, notificationId);
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        await this._notificationRepository.MarkAllReadAsync(userId);
    }

    private static NotificationDTO Map(NotificationProjection notification)
    {
        var kind = ResolveKind(notification);
        var hasTrack = notification.TrackId is not null;

        return new NotificationDTO(
            notification.Id,
            notification.NotificationType,
            notification.Title,
            notification.Message,
            notification.CreatedAt,
            notification.CreatedByName ?? string.Empty,
            notification.ReadAt is not null,
            new NotificationTargetDTO(
                kind,
                ResolveIcon(kind),
                ResolveTargetTitle(notification, kind),
                ResolveIdentifier(notification, kind),
                ResolveSubtitle(notification, kind, hasTrack),
                notification.KnowledgeAreaName ?? string.Empty,
                ResolveStatus(notification, kind),
                ResolveStatusTone(notification),
                ResolveModality(notification.TrackModality),
                ResolveSemester(notification.TrackStartsOn),
                ResolveRoute(notification, kind)));
    }

    private static string ResolveKind(NotificationProjection notification)
    {
        if (notification.TrackDocumentId is not null) return "document";
        if (notification.TrackTaskId is not null) return "task";
        if (notification.TrackId is not null) return "trail";
        return "manual";
    }

    private static string ResolveIcon(string kind)
    {
        return kind switch
        {
            "document" => "assignment",
            "task" => "task_alt",
            "trail" => "code",
            _ => "notifications"
        };
    }

    private static string ResolveTargetTitle(NotificationProjection notification, string kind)
    {
        return kind switch
        {
            "document" => notification.DocumentTemplateName ?? "Documento",
            "task" => notification.TaskTitle ?? "Tarefa",
            "trail" => notification.TrackTitle ?? "Trilha",
            _ => notification.Title
        };
    }

    private static string ResolveIdentifier(NotificationProjection notification, string kind)
    {
        return kind switch
        {
            "document" => notification.DocumentTemplateCode ?? string.Empty,
            "task" => notification.TrackCode ?? string.Empty,
            _ => notification.TrackCode ?? string.Empty
        };
    }

    private static string ResolveSubtitle(NotificationProjection notification, string kind, bool hasTrack)
    {
        if (hasTrack && notification.TrackCode is not null)
            return $"#{notification.TrackCode} | {notification.TrackTitle ?? string.Empty}";
        if (hasTrack && notification.TrackTitle is not null)
            return notification.TrackTitle;
        return ResolveTargetTitle(notification, kind);
    }

    private static string ResolveStatus(NotificationProjection notification, string kind)
    {
        return kind switch
        {
            "document" => ResolveDocumentStatus(notification.DocumentStatus),
            "task" => ResolveTaskStatus(notification.TaskStatus),
            "trail" => ResolveTrackStatus(notification.TrackStatus),
            _ => string.Empty
        };
    }

    private static string ResolveDocumentStatus(string? status)
    {
        return status switch
        {
            "draft" => "Rascunho",
            "submitted" => "Enviado",
            "changes_requested" => "Ajustes solicitados",
            "approved" => "Aprovado",
            "rejected" => "Reprovado",
            _ => status ?? string.Empty
        };
    }

    private static string ResolveTaskStatus(string? status)
    {
        return status switch
        {
            "todo" => "A fazer",
            "in_progress" => "Em andamento",
            "blocked" => "Bloqueado",
            "done" => "Concluído",
            "cancelled" => "Cancelado",
            _ => status ?? string.Empty
        };
    }

    private static string ResolveTrackStatus(string? status)
    {
        return status switch
        {
            "draft" => "Rascunho",
            "planning" => "Planejamento",
            "production" => "Produção",
            "pre_track" => "Pré Trilha",
            "running" => "Em execução",
            "post_track" => "Pós Trilha",
            "completed" => "Concluída",
            "cancelled" => "Cancelada",
            _ => status ?? string.Empty
        };
    }

    private static string ResolveStatusTone(NotificationProjection notification)
    {
        if (notification.NotificationType == "document_reviewed")
        {
            if (notification.DocumentStatus == "approved") return "green";
            return "yellow";
        }

        if (notification.NotificationType == "document_submitted") return "blue";
        if (notification.NotificationType == "task_assigned") return "yellow";
        return "blue";
    }

    private static string ResolveModality(string? modality)
    {
        return modality switch
        {
            "hybrid" => "Híbrido",
            "online" => "Online",
            _ => string.Empty
        };
    }

    private static string ResolveSemester(DateOnly? startsOn)
    {
        if (startsOn is null) return string.Empty;
        return $"{startsOn.Value.Year}/{(startsOn.Value.Month <= 6 ? 1 : 2)}";
    }

    private static string ResolveRoute(NotificationProjection notification, string kind)
    {
        return kind switch
        {
            "document" when notification.NotificationType == "document_reviewed"
                       && notification.DocumentStatus == "changes_requested"
                => $"/documents/{notification.TrackDocumentId}/review",
            "document" => $"/documents/{notification.TrackDocumentId}",
            "task" => $"/trails/{notification.TrackId}",
            "trail" => $"/trails/{notification.TrackId}",
            _ => string.Empty
        };
    }
}