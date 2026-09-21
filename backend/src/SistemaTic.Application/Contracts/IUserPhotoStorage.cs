namespace SistemaTic.Application.Contracts;

public interface IUserPhotoStorage
{
    public Task<string> SaveAsync(Guid userId, Stream content, string originalFileName);
    public Task<Stream?> OpenAsync(string storageKey);
    public void DeleteIfExists(string storageKey);
}
