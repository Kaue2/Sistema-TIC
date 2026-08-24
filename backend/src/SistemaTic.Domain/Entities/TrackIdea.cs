namespace SistemaTic.Domain.Entities;

public class TrackIdea
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public Guid? SuggestedKnowledgeAreaId { get; set; }
    public Guid? ProposedByUserId { get; set; }
    public string? ProposerName { get; set; }
    public string? ProposerContact { get; set; }
    public string Status { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public TrackIdea(Guid id, string title, string description, Guid? suggestedKnowledgeAreaId,
                      Guid? proposedByUserId, string? proposerName, string? proposerContact, string status,
                      Guid? reviewedByUserId, DateTimeOffset? reviewedAt, string? reviewNotes,
                      DateTimeOffset createdAt, DateTimeOffset updatedAt)
    {
        this.Id = id;
        this.Title = title;
        this.Description = description;
        this.SuggestedKnowledgeAreaId = suggestedKnowledgeAreaId;
        this.ProposedByUserId = proposedByUserId;
        this.ProposerName = proposerName;
        this.ProposerContact = proposerContact;
        this.Status = status;
        this.ReviewedByUserId = reviewedByUserId;
        this.ReviewedAt = reviewedAt;
        this.ReviewNotes = reviewNotes;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
    }
}
