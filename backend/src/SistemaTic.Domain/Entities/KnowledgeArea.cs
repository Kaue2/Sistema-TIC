namespace SistemaTic.Domain.Entities;

public class KnowledgeArea
{
    public Guid Id { get; set; }
    public string Code { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public KnowledgeArea(Guid id, string code, string name, string? description, bool isActive,
                          DateTimeOffset createdAt, DateTimeOffset updatedAt)
    {
        this.Id = id;
        this.Code = code;
        this.Name = name;
        this.Description = description;
        this.IsActive = isActive;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
    }
}
