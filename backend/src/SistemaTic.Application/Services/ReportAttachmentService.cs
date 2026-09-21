using System.Security.Cryptography;
using SistemaTic.Application.Contracts;
using SistemaTic.Application.DTO;

namespace SistemaTic.Application.Services;

public class ReportAttachmentService
{
    public const int MaximumImagesPerAnnex = 20;
    public const long MaximumFileSizeBytes = 15 * 1024 * 1024;

    private readonly IReportAttachmentRepository _repository;
    private readonly IFileStorage _fileStorage;

    public ReportAttachmentService(
        IReportAttachmentRepository repository,
        IFileStorage fileStorage)
    {
        _repository = repository;
        _fileStorage = fileStorage;
    }

    public Task<AttachmentStageDTO?> GetStageAsync(
        Guid documentId,
        string stageCode,
        CancellationToken cancellationToken = default)
    {
        return _repository.GetStageAsync(documentId, NormalizeStageCode(stageCode), cancellationToken);
    }

    public async Task<Guid> CreateAnnexAsync(
        Guid documentId,
        CreateReportAnnexDTO request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.StageCode))
            throw new ArgumentException("Informe a etapa do relatório.");
        if (string.IsNullOrWhiteSpace(request.AttachmentTypeCode))
            throw new ArgumentException("Informe o tipo do anexo.");

        var stageCode = NormalizeStageCode(request.StageCode);
        var typeCode = request.AttachmentTypeCode.Trim().ToUpperInvariant();
        var title = string.IsNullOrWhiteSpace(request.Title)
            ? typeCode.Replace('_', ' ')
            : request.Title.Trim();

        if (title.Length > 250)
            throw new ArgumentException("O título do anexo deve ter no máximo 250 caracteres.");

        return await _repository.CreateAnnexAsync(
            documentId,
            stageCode,
            typeCode,
            title,
            string.IsNullOrWhiteSpace(request.SourceReference) ? null : request.SourceReference.Trim(),
            userId,
            cancellationToken);
    }

    public async Task SaveAnswerAsync(
        Guid documentId,
        string questionCode,
        SaveReportAnswerDTO request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(questionCode))
            throw new ArgumentException("Informe o código da pergunta.");
        if (string.IsNullOrWhiteSpace(request.Answer))
            throw new ArgumentException("Informe a resposta da pergunta.");

        var answer = request.Answer.Trim();
        if (answer.Length > 10_000)
            throw new ArgumentException("A resposta da pergunta deve ter no máximo 10.000 caracteres.");

        await _repository.UpsertAnswerAsync(
            documentId,
            questionCode.Trim().ToUpperInvariant(),
            answer,
            userId,
            cancellationToken);
    }

    public Task<IReadOnlyList<ReportExportQuestionDTO>> GetExportQuestionsAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        return _repository.GetExportQuestionsAsync(documentId, cancellationToken);
    }

    public Task<ReportExportContextDTO?> GetExportContextAsync(
        Guid documentId,
        string stageCode,
        CancellationToken cancellationToken = default)
    {
        return _repository.GetExportContextAsync(
            documentId,
            NormalizeStageCode(stageCode),
            cancellationToken);
    }

    public async Task UploadImagesAsync(
        Guid documentId,
        Guid annexId,
        IReadOnlyList<AttachmentUploadFile> files,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (files.Count == 0)
            throw new ArgumentException("Selecione ao menos uma imagem.");

        var context = await _repository.GetUploadContextAsync(documentId, annexId, cancellationToken);
        if (!context.Exists)
            throw new KeyNotFoundException("Anexo não encontrado.");
        if (!context.IsEditable)
            throw new InvalidOperationException("O documento não está em um estado editável.");
        if (context.CurrentImageCount + files.Count > MaximumImagesPerAnnex)
            throw new ArgumentException($"Cada anexo pode conter no máximo {MaximumImagesPerAnnex} imagens.");

        var storedImages = new List<StoredAttachmentImage>();
        try
        {
            var displayOrder = context.NextDisplayOrder;
            foreach (var file in files)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var prepared = await PrepareImageAsync(file, cancellationToken);
                var imageId = Guid.NewGuid();
                var fileAssetId = Guid.NewGuid();
                var storageKey = $"report-annexes/{documentId:N}/{annexId:N}/{fileAssetId:N}{prepared.Extension}";

                try
                {
                    prepared.Content.Position = 0;
                    await _fileStorage.SaveAsync(storageKey, prepared.Content, cancellationToken);
                    storedImages.Add(new StoredAttachmentImage(
                        imageId,
                        fileAssetId,
                        storageKey,
                        Path.GetFileName(file.FileName),
                        prepared.MediaType,
                        prepared.Content.Length,
                        prepared.Sha256,
                        displayOrder++));
                }
                finally
                {
                    await prepared.Content.DisposeAsync();
                }
            }

            await _repository.AddImagesAsync(
                documentId,
                annexId,
                userId,
                storedImages,
                cancellationToken);
        }
        catch
        {
            foreach (var image in storedImages)
                await _fileStorage.DeleteAsync(image.StorageKey, CancellationToken.None);
            throw;
        }
    }

    public async Task<AttachmentDownload> DownloadImageAsync(
        Guid documentId,
        Guid imageId,
        CancellationToken cancellationToken = default)
    {
        var location = await _repository.GetImageLocationAsync(documentId, imageId, cancellationToken)
            ?? throw new KeyNotFoundException("Imagem não encontrada.");
        var stream = await _fileStorage.OpenReadAsync(location.StorageKey, cancellationToken);
        return new AttachmentDownload(stream, location.MediaType, location.OriginalFileName);
    }

    public async Task DeleteImageAsync(
        Guid documentId,
        Guid imageId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var storageKey = await _repository.DeleteImageAsync(documentId, imageId, userId, cancellationToken)
            ?? throw new KeyNotFoundException("Imagem não encontrada.");
        await _fileStorage.DeleteAsync(storageKey, cancellationToken);
    }

    public async Task DeleteAnnexAsync(
        Guid documentId,
        Guid annexId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var storageKeys = await _repository.DeleteAnnexAsync(documentId, annexId, userId, cancellationToken);
        if (storageKeys is null)
            throw new KeyNotFoundException("Anexo não encontrado.");

        foreach (var storageKey in storageKeys)
            await _fileStorage.DeleteAsync(storageKey, cancellationToken);
    }

    private static string NormalizeStageCode(string stageCode)
    {
        var normalized = stageCode.Trim().ToUpperInvariant();
        if (!normalized.StartsWith('M')) normalized = $"M{normalized}";
        return normalized;
    }

    private static async Task<PreparedImage> PrepareImageAsync(
        AttachmentUploadFile file,
        CancellationToken cancellationToken)
    {
        if (file.Length <= 0)
            throw new ArgumentException($"O arquivo {file.FileName} está vazio.");
        if (file.Length > MaximumFileSizeBytes)
            throw new ArgumentException($"O arquivo {file.FileName} excede o limite de 15 MB.");

        var content = new MemoryStream((int)file.Length);
        try
        {
            await file.Content.CopyToAsync(content, cancellationToken);
            if (content.Length > MaximumFileSizeBytes)
                throw new ArgumentException($"O arquivo {file.FileName} excede o limite de 15 MB.");

            var bytes = content.GetBuffer().AsSpan(0, (int)content.Length);
            var detected = DetectImage(bytes)
                ?? throw new ArgumentException($"O arquivo {file.FileName} não é uma imagem JPEG, PNG, WebP, BMP ou TIFF válida.");
            var sha256 = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
            content.Position = 0;
            return new PreparedImage(content, detected.MediaType, detected.Extension, sha256);
        }
        catch
        {
            await content.DisposeAsync();
            throw;
        }
    }

    private static (string MediaType, string Extension)? DetectImage(ReadOnlySpan<byte> bytes)
    {
        if (bytes.Length >= 3 && bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff)
            return ("image/jpeg", ".jpg");
        if (bytes.Length >= 8 && bytes[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a }))
            return ("image/png", ".png");
        if (bytes.Length >= 12 && bytes[..4].SequenceEqual("RIFF"u8) && bytes.Slice(8, 4).SequenceEqual("WEBP"u8))
            return ("image/webp", ".webp");
        if (bytes.Length >= 2 && bytes[..2].SequenceEqual("BM"u8))
            return ("image/bmp", ".bmp");
        if (bytes.Length >= 4 &&
            (bytes[..4].SequenceEqual(new byte[] { 0x49, 0x49, 0x2a, 0x00 }) ||
             bytes[..4].SequenceEqual(new byte[] { 0x4d, 0x4d, 0x00, 0x2a })))
            return ("image/tiff", ".tiff");
        return null;
    }

    private sealed record PreparedImage(
        MemoryStream Content,
        string MediaType,
        string Extension,
        string Sha256);
}
