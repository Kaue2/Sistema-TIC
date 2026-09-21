namespace SistemaTic.Domain.Entities;

public class FileAsset
{
    public Guid Id { get; set; }
    public string Provider { get; set; }
    public string? StorageKey { get; set; }
    public string? ExternalUrl { get; set; }
    public string OriginalFileName { get; set; }
    public string? MediaType { get; set; }
    public long? SizeBytes { get; set; }
    public string? Sha256 { get; set; }
    public Guid? UploadedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public FileAsset(Guid id, string provider, string? storageKey, string? externalUrl,
                      string originalFileName, string? mediaType, long? sizeBytes, string? sha256,
                      Guid? uploadedByUserId, DateTimeOffset createdAt, DateTimeOffset? deletedAt)
    {
        this.Id = id;
        this.Provider = provider;
        this.StorageKey = storageKey;
        this.ExternalUrl = externalUrl;
        this.OriginalFileName = originalFileName;
        this.MediaType = mediaType;
        this.SizeBytes = sizeBytes;
        this.Sha256 = sha256;
        this.UploadedByUserId = uploadedByUserId;
        this.CreatedAt = createdAt;
        this.DeletedAt = deletedAt;
    }
}
