namespace SistemaTic.Domain.Entities;

public class Roles
{
    public Guid Id { get; set; }
    public string Code { get; set; }
    public string Name { get; set; }
    public short HierarchyLevel { get; set; }
    public string? Description { get; set; }
    public Boolean IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Roles(Guid id, string code, string name, short hierarchyLevel,
                string? description, Boolean isActive, DateTimeOffset createdAt)
    {
        this.Id = id;
        this.Code = code;
        this.Name = name;
        this.HierarchyLevel = hierarchyLevel;
        this.Description = description;
        this.IsActive = isActive;
        this.CreatedAt = createdAt;
    }
}
