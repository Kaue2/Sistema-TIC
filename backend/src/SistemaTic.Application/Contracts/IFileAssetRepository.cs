using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Contracts;

public interface IFileAssetRepository
{
    public Task<FileAsset?> GetByIdAsync(Guid id);
    public Task<FileAsset> CreateAsync(
        string provider,
        string? storageKey,
        string originalFileName,
        string? mediaType,
        long? sizeBytes,
        Guid? uploadedByUserId);
    public Task<FileAsset> UpdateAsync(
        Guid id,
        string? storageKey,
        string originalFileName,
        string? mediaType,
        long? sizeBytes);
}
