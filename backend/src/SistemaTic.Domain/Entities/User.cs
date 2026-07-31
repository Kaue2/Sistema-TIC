namespace SistemaTic.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public Guid RoleId { get; set; }
    public string Email { get; set; }
    public string Name { get; set; }
    public String Status { get; set; }
    public Guid? CreatedByUser { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DisabledAt { get; set; }

    public User(Guid id, Guid roleId, string email, string name, string status, Guid? createdByUser,
                DateTimeOffset createdAt, DateTimeOffset updatedAt, DateTimeOffset? disabledAt)
    {
        this.Id = id;
        this.RoleId = roleId;
        this.Email = email;
        this.Name = name;
        this.Status = status;
        this.CreatedByUser = createdByUser;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
        this.DisabledAt = disabledAt;
    }
}
