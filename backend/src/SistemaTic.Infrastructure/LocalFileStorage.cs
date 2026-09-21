using Microsoft.Extensions.Configuration;
using SistemaTic.Application.Contracts;

namespace SistemaTic.Infrastructure;

public class LocalFileStorage : IFileStorage
{
    private readonly string _rootPath;

    public LocalFileStorage(IConfiguration configuration)
    {
        var configuredPath = configuration["FileStorage:RootPath"];
        _rootPath = Path.GetFullPath(string.IsNullOrWhiteSpace(configuredPath)
            ? Path.Combine(AppContext.BaseDirectory, "storage")
            : configuredPath);
        Directory.CreateDirectory(_rootPath);
    }

    public async Task SaveAsync(
        string storageKey,
        Stream content,
        CancellationToken cancellationToken = default)
    {
        var fullPath = ResolvePath(storageKey);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        try
        {
            await using var output = new FileStream(
                fullPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                81920,
                FileOptions.Asynchronous);
            await content.CopyToAsync(output, cancellationToken);
        }
        catch
        {
            if (File.Exists(fullPath)) File.Delete(fullPath);
            throw;
        }
    }

    public Task<Stream> OpenReadAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        Stream stream = new FileStream(
            ResolvePath(storageKey),
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            81920,
            FileOptions.Asynchronous | FileOptions.SequentialScan);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var fullPath = ResolvePath(storageKey);
        if (File.Exists(fullPath)) File.Delete(fullPath);
        return Task.CompletedTask;
    }

    private string ResolvePath(string storageKey)
    {
        var normalizedKey = storageKey.Replace('/', Path.DirectorySeparatorChar);
        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, normalizedKey));
        var rootPrefix = _rootPath.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        if (!fullPath.StartsWith(rootPrefix, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Chave de armazenamento inválida.");
        return fullPath;
    }
}
