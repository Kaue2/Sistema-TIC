namespace SistemaTic.Domain.Entities;

public class UserContact
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string ContactType { get; set; }
    public string ContactValue { get; set; }
    public string? Label { get; set; }
    public bool IsPrimary { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public UserContact(Guid id, Guid userId, string contactType, string contactValue, string? label,
                        bool isPrimary, DateTimeOffset createdAt, DateTimeOffset updatedAt)
    {
        this.Id = id;
        this.UserId = userId;
        this.ContactType = contactType;
        this.ContactValue = contactValue;
        this.Label = label;
        this.IsPrimary = isPrimary;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
    }
}
