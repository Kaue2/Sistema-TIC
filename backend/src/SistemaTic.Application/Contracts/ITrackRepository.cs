using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface ITrackRepository
{
    public Task<Track?> GetByIdAsync(Guid id);
    public Task<Track> CreateAsync(
        Guid? ideaId,
        Guid? sourceTrackId,
        Guid knowledgeAreaId,
        Guid? categoryId,
        string title,
        string? shortDescription,
        string modality,
        string? learningLevel,
        DateOnly? plannedProductionStartsOn,
        DateOnly? plannedProductionEndsOn,
        DateOnly? plannedTrackStartsOn,
        DateOnly? plannedTrackEndsOn,
        DateTimeOffset? registrationStartsAt,
        DateTimeOffset? registrationEndsAt,
        int onlineWorkloadMinutes,
        int inPersonWorkloadMinutes,
        int? plannedCapacity,
        string? targetAudience,
        string? prerequisites,
        decimal? attendanceRequirementPercent,
        Guid createdByUserId);
}
