using System.IO.Compression;
using System.Text.Json;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using SistemaTic.Api.Services;
using SistemaTic.Application.Contracts;
using SistemaTic.Application.DTO;
using SistemaTic.Application.Services;

try { await RunAsync(args); }
catch (Exception error) { Console.Error.WriteLine(error); Environment.ExitCode = 1; }

static async Task RunAsync(string[] args)
{
var root = Path.GetFullPath(args.FirstOrDefault() ?? "backend/src/SistemaTic.Api");
var samples = Path.GetFullPath("backend/TestResults/Softex");
Directory.CreateDirectory(samples);
var repository = new Fixtures(root);
var service = new ReportAttachmentService(repository, repository);
var exporter = new SoftexDocxExportService(service, new Host(root), new Clock());
var checks = 0;
void Assert(bool condition, string message) { checks++; if (!condition) throw new Exception(message); }
string Tag(SdtBlock block) => block.SdtProperties?.GetFirstChild<Tag>()?.Val?.Value ?? "";
SdtBlock Control(DocumentFormat.OpenXml.OpenXmlElement parent, string tag) => parent.Descendants<SdtBlock>().First(c => Tag(c) == tag);
async Task Fails(Func<Task<SoftexDocxExport>> action, string contains)
{
    try { var result = await action(); result.Content.Dispose(); throw new Exception("Expected export failure"); }
    catch (Exception error) when (error is ArgumentException or SoftexExportException)
    { Assert(error.Message.Contains(contains), error.Message); }
}
foreach (var code in Fixtures.Codes)
{
    using (var template = WordprocessingDocument.Open(Path.Combine(root, "Templates/Softex", code[1..] + ".docx"), false))
        foreach (var error in new OpenXmlValidator().Validate(template).Take(5))
            Console.WriteLine($"{code}: {error.Description} at {error.Path?.XPath}");
    Assert(exporter.HasTemplate(code), $"Invalid template {code}");
    var output = await exporter.CreateMultiTrailAsync([Fixtures.A, Fixtures.B, Fixtures.A], [code]);
    Assert(output.ContentType.EndsWith("wordprocessingml.document"), "Single meta must return DOCX");
    var path = Path.Combine(samples, output.FileName);
    await using (var file = File.Create(path)) await output.Content.CopyToAsync(file);
    output.Content.Position = 0;
    using (var document = WordprocessingDocument.Open(output.Content, false))
    {
        Assert(!new OpenXmlValidator().Validate(document).Any(), $"Invalid output {code}");
        var body = document.MainDocumentPart!.Document.Body!;
        var block = Control(body, "report:trails");
        var tracks = block.GetFirstChild<SdtContentBlock>()!.Elements<SdtBlock>().ToArray();
        Assert(tracks.Length == 2, "Repeated document IDs must not repeat tracks");
        Assert(Control(body, "report:date").InnerText == "São Paulo, 4 de outubro de 2026", "São Paulo timezone date");
        for (var index = 0; index < tracks.Length; index++)
        {
            var id = index == 0 ? Fixtures.A : Fixtures.B;
            var questions = await repository.GetExportQuestionsAsync(id);
            Assert(Control(tracks[index], "track:title").InnerText == $"Trilha de validação {index + 1}", "Track title");
            foreach (var question in questions.Where(q => q.StageCode == code))
            {
                Assert(Control(tracks[index], "label:" + question.QuestionCode).InnerText == question.QuestionLabel, "Wrong question association");
                var answer = tracks[index].Descendants<SdtBlock>().First(c => Tag(c) == "answer:" + question.QuestionCode || Tag(c) == "fixed:" + question.QuestionCode);
                if (Tag(answer).StartsWith("answer:"))
                    Assert(answer.InnerText == (string.IsNullOrWhiteSpace(question.Answer) ? "-" : question.Answer.Replace("\n", "")), $"Saved answer/empty answer was not preserved by code: {question.QuestionCode}");
                else
                {
                    Assert(answer.InnerText.Length > 0 && !answer.InnerText.Contains("{{"), "Institutional answer missing/unresolved");
                    using var template = WordprocessingDocument.Open(Path.Combine(root, "Templates/Softex", code[1..] + ".docx"), false);
                    var original = Control(template.MainDocumentPart!.Document.Body!, "fixed:" + question.QuestionCode).InnerText;
                    var expected = System.Text.RegularExpressions.Regex.Replace(original, @"\{\{([a-zA-Z_]+)\}\}", match =>
                        match.Groups[1].Value == "credential_count" ? questions.First(q => q.QuestionCode == "M2.6_Q16").Answer ?? "-" : "-");
                    Assert(answer.InnerText == expected, "Institutional text must be preserved");
                }
                var evidence = Control(tracks[index], "evidence:" + question.QuestionCode).InnerText;
                Assert(evidence is "" or "Título repetido", "Evidence cell must contain only linked titles");
            }
        }
        var annexes = Control(body, "report:annexes");
        Assert(annexes.Descendants<Paragraph>().Count(p => p.InnerText.StartsWith("Anexo ")) == 3, "Deduplicate by ID, preserve identical titles");
        Assert(annexes.Descendants<Drawing>().Count() == 9, "Only cited images from selected meta/tracks");
        Assert(annexes.InnerText.Contains("Trilha de validação 1") && annexes.InnerText.Contains("Trilha de validação 2"), "Annex track identification");
        var names = annexes.Descendants<DocumentFormat.OpenXml.Drawing.Wordprocessing.DocProperties>().Select(p => p.Name!.Value).ToArray();
        Assert(names.SequenceEqual(new[] { "example.png", "example.png", "example.jpg", "example.bmp", "example.tiff", "example.png", "example.jpg", "example.bmp", "example.tiff" }), "Image display order/formats");
        var sections = body.Descendants<SectionProperties>().ToArray();
        Assert(sections.Length == (code == "M2.3" ? 4 : 3) && sections[1].GetFirstChild<PageSize>()!.Orient!.Value == PageOrientationValues.Landscape, "Portrait/landscape sections");
        Assert(document.MainDocumentPart.DocumentSettingsPart!.Settings.GetFirstChild<UpdateFieldsOnOpen>()!.Val!.Value, "Automatic field update");
        Assert(body.Descendants<FieldCode>().Any(f => f.Text.Contains("TOC")), "Automatic TOC missing");
        Assert(document.MainDocumentPart.HeaderParts.Any(h => h.ImageParts.Any()), "Senac logo missing");
    }
    output.Content.Dispose();
}
var zipOutput = await exporter.CreateMultiTrailAsync([Fixtures.A, Fixtures.B], Fixtures.Codes);
using (var zip = new ZipArchive(zipOutput.Content, ZipArchiveMode.Read))
    Assert(zip.Entries.Select(e => e.Name).Order().SequenceEqual(Fixtures.Codes.Select(c => $"relatorio-softex-{c.ToLowerInvariant()}.docx").Order()), "One DOCX per meta in ZIP");
zipOutput.Content.Dispose();
var individual = await exporter.CreateAsync(Fixtures.A, "1.14");
using (var doc = WordprocessingDocument.Open(individual.Content, false))
{
    Assert(Control(doc.MainDocumentPart!.Document.Body!, "report:trails").GetFirstChild<SdtContentBlock>()!.Elements<SdtBlock>().Count() == 1, "Individual export uses same template");
    var annexes = Control(doc.MainDocumentPart.Document.Body!, "report:annexes");
    Assert(annexes.Descendants<Drawing>().Count() == 5, "Annexes from unselected tracks must not be included");
    Assert(!annexes.InnerText.Contains("Trilha de validação 2"), "Other track evidence leaked into individual export");
}
individual.Content.Dispose();
repository.NoAnnexes = true;
var empty = await exporter.CreateAsync(Fixtures.B, "M2.6");
using (var doc = WordprocessingDocument.Open(empty.Content, false))
{
    var body = doc.MainDocumentPart!.Document.Body!;
    Assert(!Control(body, "report:annexes").Descendants<Drawing>().Any(), "Unlinked annex must not be exported");
    Assert(Control(body, "fixed:M2.6_Q01").InnerText.Contains("participação", StringComparison.OrdinalIgnoreCase), "Fixed answer retained");
}
empty.Content.Dispose();
repository.NoAnnexes = false;
repository.MissingImage = true;
await Fails(() => exporter.CreateMultiTrailAsync([Fixtures.A], ["M1.13", "M2.6"]), "Meta M1.13");
repository.MissingImage = false;
repository.EmptyAnnex = true;
await Fails(() => exporter.CreateAsync(Fixtures.A, "M2.6"), "não possui imagens");
repository.EmptyAnnex = false;
await Fails(() => exporter.CreateAsync(Fixtures.A, "M2.5"), "M2.5");
await Fails(() => exporter.CreateMultiTrailAsync([], ["M1.13"]), "trilha");
await Fails(() => exporter.CreateAsync(Fixtures.A, "../../file"), "Código");
await service.CreateAnnexAsync(Fixtures.A, new("M1.14", "PLANO_ENSINO", " "), Guid.NewGuid());
Assert(repository.LastTitle == "PLANO ENSINO", "Default annex title retains the original type code fallback");
await service.CreateAnnexAsync(Fixtures.A, new("M1.14", "PLANO_ENSINO", " Meu anexo "), Guid.NewGuid());
Assert(repository.LastTitle == "Meu anexo", "Custom annex title");
async Task RejectUpload(IReadOnlyList<AttachmentUploadFile> uploads, string text)
{
    try { await service.UploadImagesAsync(Fixtures.A, Guid.NewGuid(), uploads, Guid.NewGuid()); throw new Exception("Expected rejected upload"); }
    catch (ArgumentException error) { Assert(error.Message.Contains(text), error.Message); }
}
await RejectUpload([new("large.png", "image/png", ReportAttachmentService.MaximumFileSizeBytes + 1, Stream.Null)], "15 MB");
await RejectUpload(Enumerable.Range(0, 21).Select(_ => new AttachmentUploadFile("image.png", "image/png", 1, Stream.Null)).ToArray(), "20 imagens");
await RejectUpload([new("image.bin", "application/octet-stream", 12, new MemoryStream(new byte[12]))], "JPEG, PNG, WebP, BMP ou TIFF");
Console.WriteLine($"PASS: {checks} assertions; {Fixtures.Codes.Length} templates and filled examples validated with OpenXML.");

}

sealed class Clock : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => new(2026, 10, 5, 1, 0, 0, TimeSpan.Zero);
}
sealed class Host(string root) : IWebHostEnvironment
{
    public string ApplicationName { get; set; } = "ReportTests";
    public string EnvironmentName { get; set; } = "Test";
    public string ContentRootPath { get; set; } = root;
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    public string WebRootPath { get; set; } = root;
    public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
}
sealed class Fixtures : IReportAttachmentRepository, IFileStorage
{
    public static readonly string[] Codes = ["M1.13", "M1.14", "M1.15", "M2.1", "M2.2", "M2.3", "M2.4", "M2.6"];
    public static readonly Guid A = Guid.NewGuid(), B = Guid.NewGuid();
    private readonly Dictionary<Guid, List<ReportExportQuestionDTO>> questions = [];
    private readonly Dictionary<(Guid, Guid), AttachmentFileLocation> images = [];
    public bool NoAnnexes, MissingImage, EmptyAnnex;
    public string? LastTitle;
    public Fixtures(string root)
    {
        foreach (var id in new[] { A, B })
        {
            var list = new List<ReportExportQuestionDTO>();
            foreach (var code in Codes)
            {
                using var doc = WordprocessingDocument.Open(Path.Combine(root, "Templates/Softex", code[1..] + ".docx"), false);
                var body = doc.MainDocumentPart!.Document.Body!;
                var labels = body.Descendants<SdtBlock>().Where(c => GetTag(c).StartsWith("label:")).ToArray();
                var annex1 = Annex(id, new[] { "png", "jpg", "bmp", "tiff" });
                var annex2 = Annex(id, new[] { "png" });
                for (var index = 0; index < labels.Length; index++)
                {
                    var key = GetTag(labels[index])[6..];
                    var editable = body.Descendants<SdtBlock>().Any(c => GetTag(c) == "answer:" + key);
                    var annexes = index < 2 ? annex1 : index == 2 && id == A ? annex2 : JsonSerializer.SerializeToElement(Array.Empty<object>());
                    list.Add(new(code, key, labels[index].InnerText, labels.Length - index,
                        key == "M2.6_Q16" ? "12" : editable && index % 2 == 0 ? $"Resposta cadastrada {id == A} {key}\nSegunda linha" : editable && index % 3 == 0 ? " \n" : null, annexes));
                }
            }
            questions[id] = list.OrderByDescending(q => q.QuestionCode).ToList();
        }
    }
    private static string GetTag(SdtBlock c) => c.SdtProperties?.GetFirstChild<Tag>()?.Val?.Value ?? "";
    private JsonElement Annex(Guid documentId, string[] extensions)
    {
        var entries = extensions.Select((extension, index) =>
        {
            var imageId = Guid.NewGuid();
            var media = extension == "jpg" ? "jpeg" : extension;
            images[(documentId, imageId)] = new("example." + extension, "image/" + media, "example." + extension);
            return new { image_id = imageId, original_file_name = "example." + extension, media_type = "image/" + media, display_order = index };
        }).Reverse().ToArray();
        return JsonSerializer.SerializeToElement(new[] { new { annex_id = Guid.NewGuid(), title = "Título repetido", images = entries } });
    }
    public Task<IReadOnlyList<ReportStageDTO>> GetStagesAsync(CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<ReportStageDTO>>(Codes.Append("M2.5").Select(c => new ReportStageDTO(c, c)).ToArray());
    public Task<ReportExportContextDTO?> GetExportContextAsync(Guid documentId, string stageCode, CancellationToken cancellationToken = default)
        => Task.FromResult<ReportExportContextDTO?>(new($"Trilha de validação {(documentId == A ? 1 : 2)}", stageCode));
    public Task<IReadOnlyList<ReportExportQuestionDTO>> GetExportQuestionsAsync(Guid documentId, CancellationToken cancellationToken = default)
        => Task.FromResult<IReadOnlyList<ReportExportQuestionDTO>>(questions[documentId].Select(q => q with
        { Annexes = NoAnnexes ? JsonSerializer.SerializeToElement(Array.Empty<object>()) : EmptyAnnex && q.Annexes.GetArrayLength() > 0
            ? JsonSerializer.SerializeToElement(new[] { new { annex_id = Guid.NewGuid(), title = "Anexo vazio", images = Array.Empty<object>() } }) : q.Annexes }).ToArray());
    public Task<AttachmentFileLocation?> GetImageLocationAsync(Guid documentId, Guid imageId, CancellationToken cancellationToken = default)
        => Task.FromResult<AttachmentFileLocation?>(MissingImage ? null : images.GetValueOrDefault((documentId, imageId)));
    public Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken = default)
        => Task.FromResult<Stream>(File.OpenRead(Path.Combine(AppContext.BaseDirectory, "Fixtures", storageKey)));
    public Task SaveAsync(string storageKey, Stream content, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    public Task<AttachmentStageDTO?> GetStageAsync(Guid documentId, string stageCode, CancellationToken cancellationToken = default)
        => Task.FromResult<AttachmentStageDTO?>(new(Guid.NewGuid(), stageCode, stageCode, true,
            [new(Guid.NewGuid(), "PLANO_ENSINO", "Plano de ensino", null, [], [])]));
    public Task<Guid> CreateAnnexAsync(Guid documentId, string stageCode, string attachmentTypeCode, string title, string? sourceReference, Guid userId, CancellationToken cancellationToken = default)
    { LastTitle = title; return Task.FromResult(Guid.NewGuid()); }
    public Task UpsertAnswerAsync(Guid documentId, string questionCode, string answer, Guid userId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    public Task<AnnexUploadContext> GetUploadContextAsync(Guid documentId, Guid annexId, CancellationToken cancellationToken = default)
        => Task.FromResult(new AnnexUploadContext(true, true, 0, 0));
    public Task AddImagesAsync(Guid documentId, Guid annexId, Guid userId, IReadOnlyList<StoredAttachmentImage> images, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    public Task<string?> DeleteImageAsync(Guid documentId, Guid imageId, Guid userId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    public Task<IReadOnlyList<string>?> DeleteAnnexAsync(Guid documentId, Guid annexId, Guid userId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
}
