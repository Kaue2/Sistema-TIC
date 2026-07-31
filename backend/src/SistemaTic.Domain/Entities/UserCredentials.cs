namespace SistemaTic.Domain.Entities;

public class UserCredentials
{
    public Guid UserId { get; set; }
    public string PasswordHash { get; set; }
    public bool IsTemporary { get; set; }
    public bool MustChangePassword { get; set; }
    public DateTimeOffset? TemporaryPasswordExpiresAt { get; set; }
    public DateTimeOffset? PasswordChangedAt { get; set; }
    public int FailedAttempts { get; set; }
    public DateTimeOffset? LockedUntil { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public UserCredentials(
        Guid userId,
        string passwordHash,
        bool isTemporary,
        bool mustChangePassword,
        DateTimeOffset? temporaryPasswordExpiresAt,
        DateTimeOffset? passwordChangedAt,
        int failedAttempts,
        DateTimeOffset? lockedUntil,
        DateTimeOffset updatedAt)
    {
        this.UserId = userId;
        this.PasswordHash = passwordHash;
        this.IsTemporary = isTemporary;
        this.MustChangePassword = mustChangePassword;
        this.TemporaryPasswordExpiresAt = temporaryPasswordExpiresAt;
        this.PasswordChangedAt = passwordChangedAt;
        this.FailedAttempts = failedAttempts;
        this.LockedUntil = lockedUntil;
        this.UpdatedAt = updatedAt;
    }
}