using System.Globalization;
using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;
using DocumentFormat.OpenXml.Wordprocessing;
using SistemaTic.Application.DTO;
using SistemaTic.Application.Services;
using A = DocumentFormat.OpenXml.Drawing;
using DW = DocumentFormat.OpenXml.Drawing.Wordprocessing;
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;

namespace SistemaTic.Api.Services;

public sealed class SoftexDocxExportService
{
    private const string DocxContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    private static readonly CultureInfo Portuguese = CultureInfo.GetCultureInfo("pt-BR");
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly ReportAttachmentService _reportAttachmentService;
    private readonly IWebHostEnvironment _environment;
    private readonly TimeProvider _clock;

    public SoftexDocxExportService(ReportAttachmentService service, IWebHostEnvironment environment,
        TimeProvider? clock = null)
    {
        _reportAttachmentService = service;
        _environment = environment;
        _clock = clock ?? TimeProvider.System;
    }

    private string TemplatePath(string code) => Path.Combine(_environment.ContentRootPath, "Templates", "Softex", code[1..] + ".docx");

    public bool HasTemplate(string stageCode)
    {
        if (!Regex.IsMatch(stageCode, @"^M\d+\.\d+$")) return false;
        var path = TemplatePath(stageCode);
        if (!File.Exists(path)) return false;
        try
        {
            using var doc = WordprocessingDocument.Open(path, false);
            ValidateTemplate(doc, stageCode);
            return true;
        }
        catch (Exception exception) when (exception is IOException or OpenXmlPackageException or InvalidOperationException)
        {
            return false;
        }
    }

    public Task<SoftexDocxExport> CreateAsync(Guid documentId, string stageCode, CancellationToken cancellationToken = default)
        => CreateMultiTrailAsync([documentId], [stageCode], cancellationToken);

    public Task<SoftexDocxExport> CreateCombinedAsync(Guid documentId, IEnumerable<string>? stageCodes,
        CancellationToken cancellationToken = default)
        => CreateMultiTrailAsync([documentId], stageCodes, cancellationToken);

    public async Task<SoftexDocxExport> CreateMultiTrailAsync(IEnumerable<Guid>? documentIds,
        IEnumerable<string>? stageCodes, CancellationToken cancellationToken = default)
    {
        var ids = (documentIds ?? []).Where(id => id != Guid.Empty).Distinct().ToArray();
        var codes = (stageCodes ?? []).Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(NormalizeStageCode).Distinct(StringComparer.Ordinal).ToArray();
        if (ids.Length == 0) throw new ArgumentException("Selecione ao menos uma trilha para exportar.");
        if (codes.Length == 0) throw new ArgumentException("Selecione ao menos uma meta para exportar.");
        var active = await _reportAttachmentService.GetStagesAsync(cancellationToken);
        foreach (var code in codes)
        {
            if (!active.Any(stage => stage.Code == code))
                throw new ArgumentException($"A meta {code} não está disponível.");
            if (!HasTemplate(code))
                throw new SoftexExportException($"O template da meta {code} está ausente ou inválido.");
        }
        var questionsByDocument = new Dictionary<Guid, IReadOnlyList<ReportExportQuestionDTO>>();
        foreach (var id in ids)
            questionsByDocument[id] = await _reportAttachmentService.GetExportQuestionsAsync(id, cancellationToken);
        var exports = new List<SoftexDocxExport>();
        try
        {
            foreach (var code in codes)
            {
                var tracks = new List<TrackReport>();
                foreach (var id in ids)
                {
                    var context = await _reportAttachmentService.GetExportContextAsync(id, code, cancellationToken)
                        ?? throw new KeyNotFoundException($"Documento Softex não encontrado para a meta {code}.");
                    var questions = questionsByDocument[id].Where(q => q.StageCode == code)
                        .OrderBy(q => q.QuestionDisplayOrder).ThenBy(q => q.QuestionCode, StringComparer.Ordinal)
                        .Select(q => new ExportQuestion(q, ReadAnnexes(q.Annexes))).ToArray();
                    if (questions.Length == 0) throw new KeyNotFoundException($"Não há perguntas cadastradas para a meta {code}.");
                    tracks.Add(new TrackReport(id, context, questions));
                }
                exports.Add(await ComposeAsync(code, tracks, cancellationToken));
            }
            if (exports.Count == 1) return exports[0];
            using var output = new MemoryStream();
            using (var zip = new ZipArchive(output, ZipArchiveMode.Create, leaveOpen: true))
                foreach (var export in exports)
                {
                    var entry = zip.CreateEntry(export.FileName);
                    await using var content = entry.Open();
                    await export.Content.CopyToAsync(content, cancellationToken);
                }
            return new SoftexDocxExport(new MemoryStream(output.ToArray(), writable: false),
                "application/zip", "relatorios-softex.zip");
        }
        catch
        {
            foreach (var export in exports) await export.Content.DisposeAsync();
            throw;
        }
        finally
        {
            if (exports.Count > 1)
                foreach (var export in exports) await export.Content.DisposeAsync();
        }
    }

    private async Task<SoftexDocxExport> ComposeAsync(string code, IReadOnlyList<TrackReport> tracks,
        CancellationToken cancellationToken)
    {
        using var output = new MemoryStream();
        await using (var input = File.OpenRead(TemplatePath(code)))
            await input.CopyToAsync(output, cancellationToken);
        output.Position = 0;
        using (var document = WordprocessingDocument.Open(output, true))
        {
            ValidateTemplate(document, code);
            var main = document.MainDocumentPart!;
            var body = main.Document.Body!;
            var block = FindControl(body, "report:trails");
            var prototype = (SdtBlock)block.CloneNode(true);
            var content = block.GetFirstChild<SdtContentBlock>()!;
            content.RemoveAllChildren();
            var expectedCodes = prototype.Descendants<SdtBlock>()
                .Select(Tag).Where(tag => tag.StartsWith("label:", StringComparison.Ordinal))
                .Select(tag => tag[6..]).ToHashSet(StringComparer.Ordinal);
            for (var index = 0; index < tracks.Count; index++)
            {
                var track = tracks[index];
                if (!expectedCodes.SetEquals(track.Questions.Select(q => q.Question.QuestionCode)))
                    throw new SoftexExportException($"O catálogo de perguntas da meta {code} não corresponde ao template.");
                var copy = (SdtBlock)prototype.CloneNode(true);
                var title = FindControl(copy, "track:title");
                SetControlText(title, track.Context.TrackTitle);
                if (index > 0)
                    title.Descendants<Paragraph>().First().GetFirstChild<ParagraphProperties>()!
                        .AddChild(new PageBreakBefore(), true);
                var lookup = track.Questions.ToDictionary(q => q.Question.QuestionCode, StringComparer.Ordinal);
                foreach (var control in copy.Descendants<SdtBlock>().ToArray())
                {
                    var tag = Tag(control);
                    var split = tag.IndexOf(':');
                    if (split < 0 || !lookup.TryGetValue(tag[(split + 1)..], out var question)) continue;
                    switch (tag[..split])
                    {
                        case "label":
                            if (!question.Question.QuestionLabel.StartsWith("Pergunta ", StringComparison.OrdinalIgnoreCase))
                                SetControlText(control, question.Question.QuestionLabel);
                            break;
                        case "answer":
                            SetControlText(control, string.IsNullOrWhiteSpace(question.Question.Answer) ? "-" : question.Question.Answer);
                            break;
                        case "fixed":
                            SetControlText(control, string.IsNullOrWhiteSpace(question.Question.Answer)
                                ? ReplaceVariables(control.InnerText, track) : question.Question.Answer);
                            break;
                        case "evidence":
                            SetControlText(control, string.Join("\n", question.Annexes.DistinctBy(a => a.AnnexId).Select(a => a.Title)));
                            break;
                    }
                }
                content.Append(copy);
            }
            var localDate = TimeZoneInfo.ConvertTime(_clock.GetUtcNow(), TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"));
            SetControlText(FindControl(body, "report:date"), $"São Paulo, {localDate.ToString("d 'de' MMMM 'de' yyyy", Portuguese)}");
            // The institutional delivery title belongs to the template, not its abbreviated catalog name.
            foreach (var overview in body.Descendants<SdtBlock>().Where(c => Tag(c) == "report:overview").ToArray())
                SetControlText(overview, $"Este relatório apresenta {tracks.Count} trilha(s) selecionada(s):\n" +
                    string.Join("\n", tracks.Select(t => $"{t.Context.TrackTitle} | Início previsto: {DateText(t.Context.StartsOn)} | Término previsto: {DateText(t.Context.EndsOn)}")));
            var annexBlock = FindControl(body, "report:annexes");
            var annexContent = annexBlock.GetFirstChild<SdtContentBlock>()!;
            annexContent.RemoveAllChildren();
            var seen = new HashSet<Guid>();
            uint drawingId = 10;
            var number = 0;
            foreach (var track in tracks)
                foreach (var annex in track.Questions.SelectMany(q => q.Annexes))
                {
                    if (!seen.Add(annex.AnnexId)) continue;
                    if (annex.Images.Count == 0)
                        throw new SoftexExportException($"Meta {code}: o anexo “{annex.Title}” de {track.Context.TrackTitle} não possui imagens.");
                    var heading = TextParagraph($"Anexo {++number}: {annex.Title} - {track.Context.TrackTitle}", bold: true);
                    heading.ParagraphProperties!.AddChild(new KeepNext(), true);
                    if (number > 1) heading.ParagraphProperties.AddChild(new PageBreakBefore(), true);
                    annexContent.Append(heading);
                    if (!string.IsNullOrWhiteSpace(annex.SourceReference))
                        annexContent.Append(TextParagraph($"Fonte: {annex.SourceReference}"));
                    foreach (var image in annex.Images.OrderBy(i => i.DisplayOrder).ThenBy(i => i.ImageId))
                    {
                        if (image.MediaType.ToLowerInvariant() is not ("image/jpeg" or "image/png" or "image/bmp" or "image/tiff"))
                            throw new SoftexExportException($"Meta {code}: formato inválido na evidência “{annex.Title}”, arquivo {image.OriginalFileName}.");
                        try
                        {
                            var download = await _reportAttachmentService.DownloadImageAsync(track.DocumentId, image.ImageId, cancellationToken);
                            await using var imageBytes = new MemoryStream();
                            await using (download.Content) await download.Content.CopyToAsync(imageBytes, cancellationToken);
                            var (width, height) = GetImageSize(imageBytes, image.MediaType);
                            imageBytes.Position = 0;
                            var part = main.AddImagePart(image.MediaType);
                            part.FeedData(imageBytes);
                            annexContent.Append(new Paragraph(new ParagraphProperties(new SpacingBetweenLines { After = "160" }),
                                new Run(CreateImageDrawing(main.GetIdOfPart(part), width, height, drawingId++, image.OriginalFileName))));
                        }
                        catch (Exception exception) when (exception is IOException or KeyNotFoundException or ArgumentException or OverflowException)
                        {
                            throw new SoftexExportException($"Meta {code}: não foi possível incorporar a evidência “{annex.Title}”, arquivo {image.OriginalFileName}.", exception);
                        }
                    }
                }
            if (number == 0) annexContent.Append(TextParagraph("Nenhuma evidência foi citada nesta meta."));
            main.Document.Save();
            var errors = new OpenXmlValidator().Validate(document).Take(1).ToArray();
            if (errors.Length > 0) throw new SoftexExportException($"Meta {code}: o documento gerado possui estrutura inválida: {errors[0].Description}");
        }
        return new SoftexDocxExport(new MemoryStream(output.ToArray(), writable: false), DocxContentType,
            $"relatorio-softex-{code.ToLowerInvariant()}.docx");
    }

    private static void ValidateTemplate(WordprocessingDocument document, string code)
    {
        var body = document.MainDocumentPart?.Document.Body
            ?? throw new SoftexExportException($"Meta {code}: template sem corpo de documento.");
        foreach (var tag in new[] { "report:stage", "report:date", "report:trails", "report:annexes", "track:title" })
            FindControl(body, tag);
        var trail = FindControl(body, "report:trails");
        var tags = trail.Descendants<SdtBlock>().Select(Tag).ToArray();
        var questions = tags.Where(tag => tag.StartsWith("label:", StringComparison.Ordinal)).Select(tag => tag[6..]).ToArray();
        if (questions.Length == 0)
            throw new SoftexExportException($"Meta {code}: template sem perguntas identificadas.");
        if (questions.Distinct(StringComparer.Ordinal).Count() != questions.Length)
            throw new SoftexExportException($"Meta {code}: template com perguntas duplicadas.");
        foreach (var question in questions)
            if (!Regex.IsMatch(question, "^" + Regex.Escape(code) + @"_Q\d{2}$") ||
                tags.Count(tag => tag == "answer:" + question || tag == "fixed:" + question) != 1 ||
                tags.Count(tag => tag == "evidence:" + question) != 1)
                throw new SoftexExportException($"Meta {code}: controles incompletos ou inválidos para a pergunta {question}.");
        var error = new OpenXmlValidator().Validate(document).FirstOrDefault();
        if (error is not null) throw new SoftexExportException($"Meta {code}: template inválido: {error.Description}");
    }

    private static string Tag(SdtBlock control) => control.SdtProperties?.GetFirstChild<Tag>()?.Val?.Value ?? "";
    private static SdtBlock FindControl(OpenXmlElement root, string tag)
        => root.Descendants<SdtBlock>().FirstOrDefault(c => Tag(c) == tag)
            ?? throw new SoftexExportException($"O template não possui o campo obrigatório {tag}.");

    private static void SetControlText(SdtBlock control, string text)
    {
        var content = control.GetFirstChild<SdtContentBlock>()!;
        var source = content.Descendants<Paragraph>().FirstOrDefault();
        var props = source?.ParagraphProperties?.CloneNode(true) as ParagraphProperties;
        var runProps = source?.Descendants<RunProperties>().FirstOrDefault()?.CloneNode(true) as RunProperties;
        content.RemoveAllChildren();
        var paragraph = new Paragraph();
        if (props is not null) paragraph.Append(props);
        var run = new Run();
        if (runProps is not null) run.Append(runProps);
        foreach (var (line, index) in text.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n').Select((line, index) => (line, index)))
        {
            if (index > 0) run.Append(new Break());
            run.Append(new Text(line) { Space = SpaceProcessingModeValues.Preserve });
        }
        paragraph.Append(run);
        content.Append(paragraph);
    }

    private static Paragraph TextParagraph(string text, bool bold = false)
        => new(new ParagraphProperties(new SpacingBetweenLines { After = "120" }),
            new Run(new RunProperties(bold ? new Bold() : new Bold { Val = false }), new Text(text)));

    private static string ReplaceVariables(string text, TrackReport track)
    {
        var values = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["track_title"] = track.Context.TrackTitle,
            ["starts_on"] = DateText(track.Context.StartsOn),
            ["ends_on"] = DateText(track.Context.EndsOn),
            ["level"] = track.Context.LearningLevel ?? "-",
            ["credential_count"] = track.Questions.FirstOrDefault(q => q.Question.QuestionCode == "M2.6_Q16")?.Question.Answer ?? "-",
            ["emission_date"] = "-", ["collection_dates"] = "-", ["indicators"] = "-", ["contact"] = "-"
        };
        if (!string.IsNullOrWhiteSpace(track.Context.IntroJson))
        {
            using var intro = JsonDocument.Parse(track.Context.IntroJson);
            if (intro.RootElement.ValueKind == JsonValueKind.Object)
                foreach (var property in intro.RootElement.EnumerateObject())
                    if (property.Value.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(property.Value.GetString()))
                        values[property.Name] = property.Value.GetString()!;
        }
        foreach (var key in values.Keys.ToArray())
            if (string.IsNullOrWhiteSpace(values[key])) values[key] = "-";
        return Regex.Replace(text, @"\{\{([a-zA-Z_]+)\}\}", match => values.GetValueOrDefault(match.Groups[1].Value, "-"));
    }

    private static string DateText(DateOnly? date) => date?.ToString("dd/MM/yyyy", Portuguese) ?? "-";
    private static string NormalizeStageCode(string stageCode)
    {
        var code = stageCode.Trim().ToUpperInvariant();
        if (!code.StartsWith('M')) code = "M" + code;
        if (!Regex.IsMatch(code, @"^M\d+\.\d+$")) throw new ArgumentException("Código de meta inválido.");
        return code;
    }

    private static IReadOnlyList<ExportAnnex> ReadAnnexes(JsonElement annexes)
        => annexes.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined ? [] :
            JsonSerializer.Deserialize<List<ExportAnnex>>(annexes.GetRawText(), JsonOptions)?
                .Where(a => a.AnnexId != Guid.Empty).ToArray() ?? [];

    private static (long Width, long Height) GetImageSize(Stream content, string mediaType)
    {
        content.Position = 0;
        using var reader = new BinaryReader(content, System.Text.Encoding.UTF8, leaveOpen: true);
        var (width, height) = mediaType.ToLowerInvariant() switch
        {
            "image/png" => ReadPngSize(reader), "image/jpeg" => ReadJpegSize(reader),
            "image/bmp" => ReadBmpSize(reader), "image/tiff" => ReadTiffSize(reader), _ => (0, 0)
        };
        if (width <= 0 || height <= 0) throw new IOException("Não foi possível determinar as dimensões da imagem.");
        const long emus = 9525;
        var scale = Math.Min(1d, Math.Min(5_670_000d / (width * emus), 7_560_000d / (height * emus)));
        return ((long)(width * emus * scale), (long)(height * emus * scale));
    }

    private static (int Width, int Height) ReadTiffSize(BinaryReader reader)
    {
        var order = reader.ReadBytes(2);
        var little = order.SequenceEqual("II"u8.ToArray());
        if (!little && !order.SequenceEqual("MM"u8.ToArray())) return (0, 0);
        ushort U16() { var bytes = reader.ReadBytes(2); return little ? BitConverter.ToUInt16(bytes) : (ushort)((bytes[0] << 8) | bytes[1]); }
        uint U32() { var bytes = reader.ReadBytes(4); return little ? BitConverter.ToUInt32(bytes) : (uint)ReadBigEndianInt32(bytes); }
        if (U16() != 42) return (0, 0);
        reader.BaseStream.Position = U32();
        var count = U16();
        int width = 0, height = 0;
        for (var index = 0; index < count; index++)
        {
            var tag = U16(); var type = U16(); var length = U32();
            var valuePosition = reader.BaseStream.Position;
            var value = type == 3 ? U16() : U32();
            reader.BaseStream.Position = valuePosition + 4;
            if (length != 1) continue;
            if (tag == 256) width = (int)value;
            if (tag == 257) height = (int)value;
        }
        return (width, height);
    }

    private sealed record TrackReport(Guid DocumentId, ReportExportContextDTO Context, IReadOnlyList<ExportQuestion> Questions);
    private static (int Width, int Height) ReadPngSize(BinaryReader reader)
    {
        var signature = reader.ReadBytes(24);
        if (signature.Length < 24 || !signature.AsSpan(1, 3).SequenceEqual("PNG"u8)) return (0, 0);
        return (
            ReadBigEndianInt32(signature.AsSpan(16, 4)),
            ReadBigEndianInt32(signature.AsSpan(20, 4)));
    }

    private static (int Width, int Height) ReadBmpSize(BinaryReader reader)
    {
        var header = reader.ReadBytes(26);
        if (header.Length < 26 || header[0] != 'B' || header[1] != 'M') return (0, 0);
        return (
            BitConverter.ToInt32(header, 18),
            Math.Abs(BitConverter.ToInt32(header, 22)));
    }

    private static (int Width, int Height) ReadJpegSize(BinaryReader reader)
    {
        if (reader.ReadByte() != 0xff || reader.ReadByte() != 0xd8) return (0, 0);
        while (reader.BaseStream.Position < reader.BaseStream.Length)
        {
            if (reader.ReadByte() != 0xff) continue;
            byte marker;
            do marker = reader.ReadByte(); while (marker == 0xff);
            if (marker is 0xd8 or 0xd9) continue;

            var length = ReadBigEndianUInt16(reader);
            if (length < 2 || reader.BaseStream.Position + length - 2 > reader.BaseStream.Length) return (0, 0);
            if (marker is >= 0xc0 and <= 0xc3 or >= 0xc5 and <= 0xc7 or >= 0xc9 and <= 0xcb or >= 0xcd and <= 0xcf)
            {
                reader.ReadByte();
                var height = ReadBigEndianUInt16(reader);
                var width = ReadBigEndianUInt16(reader);
                return (width, height);
            }
            reader.BaseStream.Seek(length - 2, SeekOrigin.Current);
        }
        return (0, 0);
    }

    private static int ReadBigEndianInt32(ReadOnlySpan<byte> value)
    {
        return (value[0] << 24) | (value[1] << 16) | (value[2] << 8) | value[3];
    }

    private static int ReadBigEndianUInt16(BinaryReader reader)
    {
        return (reader.ReadByte() << 8) | reader.ReadByte();
    }

    private static Drawing CreateImageDrawing(
        string relationshipId,
        long width,
        long height,
        uint drawingId,
        string fileName)
    {
        return new Drawing(
            new DW.Inline(
                new DW.Extent { Cx = width, Cy = height },
                new DW.EffectExtent
                {
                    LeftEdge = 0L,
                    TopEdge = 0L,
                    RightEdge = 0L,
                    BottomEdge = 0L
                },
                new DW.DocProperties { Id = drawingId, Name = fileName },
                new DW.NonVisualGraphicFrameDrawingProperties(
                    new A.GraphicFrameLocks { NoChangeAspect = true }),
                new A.Graphic(
                    new A.GraphicData(
                        new PIC.Picture(
                            new PIC.NonVisualPictureProperties(
                                new PIC.NonVisualDrawingProperties { Id = 0U, Name = fileName },
                                new PIC.NonVisualPictureDrawingProperties()),
                            new PIC.BlipFill(
                                new A.Blip { Embed = relationshipId },
                                new A.Stretch(new A.FillRectangle())),
                            new PIC.ShapeProperties(
                                new A.Transform2D(
                                    new A.Offset { X = 0L, Y = 0L },
                                    new A.Extents { Cx = width, Cy = height }),
                                new A.PresetGeometry(new A.AdjustValueList())
                                {
                                    Preset = A.ShapeTypeValues.Rectangle
                                })))
                    {
                        Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture"
                    }))
            {
                DistanceFromTop = 0U,
                DistanceFromBottom = 0U,
                DistanceFromLeft = 0U,
                DistanceFromRight = 0U
            });
    }

    private sealed record ExportQuestion(
        ReportExportQuestionDTO Question,
        IReadOnlyList<ExportAnnex> Annexes);

    private sealed class ExportAnnex
    {
        [JsonPropertyName("annex_id")]
        public Guid AnnexId { get; init; }

        [JsonPropertyName("title")]
        public string Title { get; init; } = "Anexo sem título";

        [JsonPropertyName("source_reference")]
        public string? SourceReference { get; init; }

        [JsonPropertyName("images")]
        public List<ExportImage> Images { get; init; } = [];
    }

    private sealed class ExportImage
    {
        [JsonPropertyName("image_id")]
        public Guid ImageId { get; init; }

        [JsonPropertyName("original_file_name")]
        public string OriginalFileName { get; init; } = "imagem";

        [JsonPropertyName("media_type")]
        public string MediaType { get; init; } = "application/octet-stream";

        [JsonPropertyName("display_order")]
        public int DisplayOrder { get; init; }
    }
}

public sealed record SoftexDocxExport(Stream Content, string ContentType, string FileName);

public sealed class SoftexExportException(string message, Exception? inner = null) : IOException(message, inner);
