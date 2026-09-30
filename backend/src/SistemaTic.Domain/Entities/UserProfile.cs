namespace SistemaTic.Domain.Entities;

public class UserProfile
{
    public Guid UserId { get; set; }
    public string? PreferredName { get; set; }
    public Guid? PhotoFileId { get; set; }
    public string? WorkLocation { get; set; }
    public int? WeeklyWorkloadMinutes { get; set; }
    public string? Biography { get; set; }
    public string? LattesUrl { get; set; }
    public string? CurriculumUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public Guid? KnowledgeAreaId { get; set; }

    public UserProfile(Guid userId, string? preferredName, Guid? photoFileId, string? workLocation,
                        int? weeklyWorkloadMinutes, string? biography, string? lattesUrl,
                        string? curriculumUrl,
                        DateTimeOffset createdAt, DateTimeOffset updatedAt, Guid? knowledgeAreaId)
    {
        this.UserId = userId;
        this.PreferredName = preferredName;
        this.PhotoFileId = photoFileId;
        this.WorkLocation = workLocation;
        this.WeeklyWorkloadMinutes = weeklyWorkloadMinutes;
        this.Biography = biography;
        this.LattesUrl = lattesUrl;
        this.CurriculumUrl = curriculumUrl;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
        this.KnowledgeAreaId = knowledgeAreaId;
    }
}
