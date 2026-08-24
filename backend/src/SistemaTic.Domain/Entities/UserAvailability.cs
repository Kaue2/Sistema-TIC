namespace SistemaTic.Domain.Entities;

public class UserAvailability
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public short Weekday { get; set; }
    public TimeOnly StartsAt { get; set; }
    public TimeOnly EndsAt { get; set; }
    public string Timezone { get; set; }
    public DateOnly? ValidFrom { get; set; }
    public DateOnly? ValidUntil { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public UserAvailability(
        Guid id,
        Guid userId,
        short weekday,
        TimeOnly startsAt,
        TimeOnly endsAt,
        string timezone,
        DateOnly? validFrom,
        DateOnly? validUntil,
        string? notes,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        this.Id = id;
        this.UserId = userId;
        this.Weekday = weekday;
        this.StartsAt = startsAt;
        this.EndsAt = endsAt;
        this.Timezone = timezone;
        this.ValidFrom = validFrom;
        this.ValidUntil = validUntil;
        this.Notes = notes;
        this.CreatedAt = createdAt;
        this.UpdatedAt = updatedAt;
    }

    public static readonly Dictionary<string, short> WeekdayMap = new()
    {
        ["Domingo"] = 0,
        ["Segunda"] = 1,
        ["Terça"] = 2,
        ["Quarta"] = 3,
        ["Quinta"] = 4,
        ["Sexta"] = 5,
        ["Sábado"] = 6,
    };
}
