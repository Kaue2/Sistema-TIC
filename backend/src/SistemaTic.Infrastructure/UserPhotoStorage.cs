using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using SistemaTic.Application.Contracts;

namespace SistemaTic.Infrastructure;

public class UserPhotoStorage : IUserPhotoStorage
{
    private static readonly Regex SafeExtension = new(@"^\.[a-zA-Z0-9]{1,10}$");

    private readonly string _basePath;

    public UserPhotoStorage(IConfiguration configuration)
    {
        var configuredPath = configuration["FileStorage:PhotosPath"]
            ?? throw new Exception("FileStorage:PhotosPath não configurado");

        this._basePath = ResolvePath(configuredPath);
        Directory.CreateDirectory(this._basePath);
    }

    private static string ResolvePath(string path)
    {
        if (path.StartsWith('~'))
        {
            string home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string[] relativeSegments = path[1..].Split(['/', '\\'], StringSplitOptions.RemoveEmptyEntries);
            path = Path.Combine([home, .. relativeSegments]);
        }

        return Path.GetFullPath(path);
    }

    public async Task<string> SaveAsync(Guid userId, Stream content, string originalFileName)
    {
        string extension = Path.GetExtension(originalFileName);
        if (!SafeExtension.IsMatch(extension))
        {
            extension = ".jpg";
        }

        string storageKey = $"{userId:N}{extension}";
        string fullPath = Path.Combine(this._basePath, storageKey);

        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream);

        return storageKey;
    }

    public Task<Stream?> OpenAsync(string storageKey)
    {
        string fullPath = Path.Combine(this._basePath, storageKey);
        if (!File.Exists(fullPath))
        {
            return Task.FromResult<Stream?>(null);
        }

        return Task.FromResult<Stream?>(File.OpenRead(fullPath));
    }

    public void DeleteIfExists(string storageKey)
    {
        string fullPath = Path.Combine(this._basePath, storageKey);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }
    }
}
