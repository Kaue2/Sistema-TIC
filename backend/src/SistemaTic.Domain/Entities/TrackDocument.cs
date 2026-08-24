namespace SistemaTic.Domain.Entities;

public class TrackDocument
{
    public Guid Id { get; set; }
    public Guid TrackId { get; set; }
    public Guid DocumentTemplateId { get; set; }
    public Guid TemplateVersionId { get; set; }
    public string CurrentContent { get; set; }
    public int CurrentRevisionNumber { get; set; }
    public string Status { get; set; }
    public string? SharepointUrl { get; set; }
    public string? SharepointItemId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public Guid UpdatedByUserId { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public TrackDocument(Guid id, Guid trackId, Guid documentTemplateId, Guid templateVersionId,
                          string currentContent, int currentRevisionNumber, string status,
                          string? sharepointUrl, string? sharepointItemId, Guid createdByUserId,
                          Guid updatedByUserId, DateTimeOffset? submittedAt, DateTimeOffset? approvedAt,
                          DateTimeOffset createdAt, DateTimeOffset updatedAt)
    {
        this.Id = id;
        this.TrackId = trackId;
        this.DocumentTemplateId = documentTemplateId;
        this.TemplateVersionId = templateVersionId;
        this.CurrentContent = currentContent;
        this.CurrentRevisionNumber = currentRevisionNumber;
        this.Status = status;
        this.SharepointUrl = sharepointUrl;
        this.SharepointItemId = sharepointItemId;
        this.CreatedByUserId = createdByUserId;
        this.UpdatedByUserId = updatedByUserId;
        this.SubmittedAt = submittedAt;
        this.ApprovedAt = approvedAt;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
    }
}
