namespace SistemaTic.Domain.Entities;

public class Track
{
    public Guid Id { get; set; }
    public int Code { get; set; }
    public Guid? IdeaId { get; set; }
    public Guid? SourceTrackId { get; set; }
    public Guid KnowledgeAreaId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Title { get; set; }
    public string? ShortDescription { get; set; }
    public string Modality { get; set; }
    public string? LearningLevel { get; set; }
    public string Status { get; set; }
    public DateOnly? PlannedProductionStartsOn { get; set; }
    public DateOnly? PlannedProductionEndsOn { get; set; }
    public DateOnly? PlannedTrackStartsOn { get; set; }
    public DateOnly? PlannedTrackEndsOn { get; set; }
    public DateTimeOffset? RegistrationStartsAt { get; set; }
    public DateTimeOffset? RegistrationEndsAt { get; set; }
    public int OnlineWorkloadMinutes { get; set; }
    public int InPersonWorkloadMinutes { get; set; }
    public int TotalWorkloadMinutes { get; set; }
    public int? PlannedCapacity { get; set; }
    public string? TargetAudience { get; set; }
    public string? Prerequisites { get; set; }
    public decimal? AttendanceRequirementPercent { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }

    public Track(Guid id, int code, Guid? ideaId, Guid? sourceTrackId, Guid knowledgeAreaId,
                 Guid? categoryId, string title, string? shortDescription, string modality,
                 string? learningLevel, string status, DateOnly? plannedProductionStartsOn,
                 DateOnly? plannedProductionEndsOn, DateOnly? plannedTrackStartsOn,
                 DateOnly? plannedTrackEndsOn, DateTimeOffset? registrationStartsAt,
                 DateTimeOffset? registrationEndsAt, int onlineWorkloadMinutes,
                 int inPersonWorkloadMinutes, int totalWorkloadMinutes, int? plannedCapacity,
                 string? targetAudience, string? prerequisites, decimal? attendanceRequirementPercent,
                 Guid createdByUserId, DateTimeOffset createdAt, DateTimeOffset updatedAt,
                 DateTimeOffset? cancelledAt)
    {
        this.Id = id;
        this.Code = code;
        this.IdeaId = ideaId;
        this.SourceTrackId = sourceTrackId;
        this.KnowledgeAreaId = knowledgeAreaId;
        this.CategoryId = categoryId;
        this.Title = title;
        this.ShortDescription = shortDescription;
        this.Modality = modality;
        this.LearningLevel = learningLevel;
        this.Status = status;
        this.PlannedProductionStartsOn = plannedProductionStartsOn;
        this.PlannedProductionEndsOn = plannedProductionEndsOn;
        this.PlannedTrackStartsOn = plannedTrackStartsOn;
        this.PlannedTrackEndsOn = plannedTrackEndsOn;
        this.RegistrationStartsAt = registrationStartsAt;
        this.RegistrationEndsAt = registrationEndsAt;
        this.OnlineWorkloadMinutes = onlineWorkloadMinutes;
        this.InPersonWorkloadMinutes = inPersonWorkloadMinutes;
        this.TotalWorkloadMinutes = totalWorkloadMinutes;
        this.PlannedCapacity = plannedCapacity;
        this.TargetAudience = targetAudience;
        this.Prerequisites = prerequisites;
        this.AttendanceRequirementPercent = attendanceRequirementPercent;
        this.CreatedByUserId = createdByUserId;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
        this.CancelledAt = cancelledAt;
    }
}
