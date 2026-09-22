using System.Text.Json;
using System.Text.Json.Serialization;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using SistemaTic.Application.DTO;
using SistemaTic.Application.Services;
using A = DocumentFormat.OpenXml.Drawing;
using DW = DocumentFormat.OpenXml.Drawing.Wordprocessing;
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;

namespace SistemaTic.Api.Services;

public sealed class SoftexDocxExportService
{
    private const string DocxContentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly ReportAttachmentService _reportAttachmentService;
    private readonly IWebHostEnvironment _environment;

    public SoftexDocxExportService(
        ReportAttachmentService reportAttachmentService,
        IWebHostEnvironment environment)
    {
        _reportAttachmentService = reportAttachmentService;
        _environment = environment;
    }

    public async Task<SoftexDocxExport> CreateAsync(
        Guid documentId,
        string stageCode,
        CancellationToken cancellationToken = default)
    {
        var normalizedStageCode = NormalizeStageCode(stageCode);
        var context = await _reportAttachmentService
            .GetExportContextAsync(documentId, normalizedStageCode, cancellationToken)
            ?? throw new KeyNotFoundException("O documento Softex ou a etapa não foi encontrada.");
        var questions = (await _reportAttachmentService
                .GetExportQuestionsAsync(documentId, cancellationToken))
            .Where(question => question.StageCode.Equals(normalizedStageCode, StringComparison.OrdinalIgnoreCase))
            .OrderBy(question => question.QuestionDisplayOrder)
            .ThenBy(question => question.QuestionCode, StringComparer.Ordinal)
            .ToArray();

        if (questions.Length == 0)
            throw new KeyNotFoundException("Não há perguntas Softex para esta etapa.");

        var templatePath = Path.Combine(
            _environment.ContentRootPath,
            "Templates",
            "Softex",
            normalizedStageCode[1..] + ".docx");
        if (!File.Exists(templatePath))
            throw new FileNotFoundException("O modelo DOCX da etapa não está disponível.", templatePath);

        var exportQuestions = questions
            .Select(question => new ExportQuestion(question, ReadAnnexes(question.Annexes)))
            .ToArray();
        var annexes = GetUniqueAnnexes(exportQuestions);
        var annexNumbers = annexes
            .Select((annex, index) => new { annex.AnnexId, Number = index + 1 })
            .ToDictionary(item => item.AnnexId, item => item.Number);

        var output = new MemoryStream();
        await using (var input = File.OpenRead(templatePath))
            await input.CopyToAsync(output, cancellationToken);

        output.Position = 0;
        using (var document = WordprocessingDocument.Open(output, true))
        {
            var mainPart = document.MainDocumentPart
                ?? throw new InvalidOperationException("O modelo DOCX não possui documento principal.");
            var sourceBody = mainPart.Document.Body
                ?? throw new InvalidOperationException("O modelo DOCX não possui corpo de documento.");
            var sourceTable = FindQuestionTable(sourceBody);
            var sectionProperties = GetTableSectionProperties(sourceBody, sourceTable)
                ?? sourceBody.Elements<SectionProperties>().LastOrDefault()?.CloneNode(true) as SectionProperties
                ?? new SectionProperties();
            var questionTable = sourceTable is null
                ? CreateQuestionTable(exportQuestions)
                : (Table)sourceTable.CloneNode(true);

            PopulateQuestionTable(questionTable, exportQuestions, annexNumbers);

            sourceBody.RemoveAllChildren();
            sourceBody.Append(CreateTitleParagraph("RELATÓRIO DE PRESTAÇÃO DE CONTAS SENAC PARA SOFTEX"));
            sourceBody.Append(CreateSubtitleParagraph($"Trilha: {context.TrackTitle}"));
            sourceBody.Append(CreateSubtitleParagraph($"Etapa {normalizedStageCode} - {context.StageName}"));
            sourceBody.Append(questionTable);

            uint drawingId = 1;
            AppendAnnexHeading(sourceBody, annexes.Count > 0);
            foreach (var annex in annexes)
            {
                AppendAnnexTitle(sourceBody, annexNumbers[annex.AnnexId], annex);
                drawingId = await AppendAnnexImagesAsync(
                    sourceBody,
                    mainPart,
                    documentId,
                    annex,
                    drawingId,
                    cancellationToken);
            }

            sourceBody.Append(sectionProperties);
            mainPart.Document.Save();
        }

        var bytes = output.ToArray();
        await output.DisposeAsync();
        return new SoftexDocxExport(
            new MemoryStream(bytes, writable: false),
            DocxContentType,
            $"relatorio-softex-{normalizedStageCode.ToLowerInvariant()}.docx");
    }

    public async Task<SoftexDocxExport> CreateCombinedAsync(
        Guid documentId,
        IEnumerable<string>? stageCodes,
        CancellationToken cancellationToken = default)
    {
        return await CreateMultiTrailAsync([documentId], stageCodes, cancellationToken);
    }

    public async Task<SoftexDocxExport> CreateMultiTrailAsync(
        IEnumerable<Guid>? documentIds,
        IEnumerable<string>? stageCodes,
        CancellationToken cancellationToken = default)
    {
        var normalizedDocumentIds = (documentIds ?? [])
            .Where(documentId => documentId != Guid.Empty)
            .Distinct()
            .ToArray();
        if (normalizedDocumentIds.Length == 0)
            throw new ArgumentException("Selecione ao menos uma trilha para exportar.");

        var normalizedStageCodes = (stageCodes ?? [])
            .Where(stageCode => !string.IsNullOrWhiteSpace(stageCode))
            .Select(NormalizeStageCode)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        if (normalizedStageCodes.Length == 0)
            throw new ArgumentException("Selecione ao menos uma meta para exportar.");

        var reports = new List<CombinedDocument>();
        string? baseTemplatePath = null;
        foreach (var documentId in normalizedDocumentIds)
        {
            var allQuestions = await _reportAttachmentService
                .GetExportQuestionsAsync(documentId, cancellationToken);
            var stages = new List<CombinedStage>();

            foreach (var stageCode in normalizedStageCodes)
            {
                var context = await _reportAttachmentService
                    .GetExportContextAsync(documentId, stageCode, cancellationToken)
                    ?? throw new KeyNotFoundException(
                        $"O documento Softex ou a meta {stageCode} não foi encontrada.");
                var questions = allQuestions
                    .Where(question => question.StageCode.Equals(stageCode, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(question => question.QuestionDisplayOrder)
                    .ThenBy(question => question.QuestionCode, StringComparer.Ordinal)
                    .Select(question => new ExportQuestion(question, ReadAnnexes(question.Annexes)))
                    .ToArray();
                if (questions.Length == 0)
                    throw new KeyNotFoundException($"Não há perguntas Softex para a meta {stageCode}.");

                Table? templateTable = null;
                var templatePath = Path.Combine(
                    _environment.ContentRootPath,
                    "Templates",
                    "Softex",
                    stageCode[1..] + ".docx");
                if (File.Exists(templatePath))
                {
                    using var template = WordprocessingDocument.Open(templatePath, false);
                    var templateBody = template.MainDocumentPart?.Document.Body
                        ?? throw new InvalidOperationException("O modelo DOCX não possui corpo de documento.");
                    var sourceTable = FindQuestionTable(templateBody);
                    templateTable = sourceTable is null
                        ? null
                        : (Table)sourceTable.CloneNode(true);
                    baseTemplatePath ??= templatePath;
                }

                stages.Add(new CombinedStage(stageCode, context, questions, templateTable));
            }

            reports.Add(new CombinedDocument(documentId, stages[0].Context.TrackTitle, stages));
        }

        baseTemplatePath ??= Directory
            .EnumerateFiles(
                Path.Combine(_environment.ContentRootPath, "Templates", "Softex"),
                "*.docx")
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();
        if (baseTemplatePath is null)
            throw new FileNotFoundException("Nenhum modelo DOCX Softex está disponível.");

        var annexes = GetUniqueAnnexes(
            reports.SelectMany(report => report.Stages).SelectMany(stage => stage.Questions));
        var annexNumbers = annexes
            .Select((annex, index) => new { annex.AnnexId, Number = index + 1 })
            .ToDictionary(item => item.AnnexId, item => item.Number);

        var output = new MemoryStream();
        await using (var input = File.OpenRead(baseTemplatePath))
            await input.CopyToAsync(output, cancellationToken);

        output.Position = 0;
        using (var document = WordprocessingDocument.Open(output, true))
        {
            var mainPart = document.MainDocumentPart
                ?? throw new InvalidOperationException("O modelo DOCX n\u00e3o possui documento principal.");
            var sourceBody = mainPart.Document.Body
                ?? throw new InvalidOperationException("O modelo DOCX n\u00e3o possui corpo de documento.");
            var sourceTable = FindQuestionTable(sourceBody);
            var sectionProperties = GetTableSectionProperties(sourceBody, sourceTable)
                ?? sourceBody.Elements<SectionProperties>().LastOrDefault()?.CloneNode(true) as SectionProperties
                ?? new SectionProperties();

            sourceBody.RemoveAllChildren();
            sourceBody.Append(CreateTitleParagraph("RELAT\u00d3RIO DE PRESTA\u00c7\u00c3O DE CONTAS SENAC PARA SOFTEX"));
            sourceBody.Append(CreateSubtitleParagraph(
                reports.Count == 1
                    ? $"Trilha: {reports[0].TrackTitle}"
                    : $"Trilhas selecionadas: {reports.Count}"));
            sourceBody.Append(CreateSubtitleParagraph($"Metas selecionadas: {string.Join(", ", normalizedStageCodes)}"));

            for (var reportIndex = 0; reportIndex < reports.Count; reportIndex++)
            {
                sourceBody.Append(CreateStageTitleParagraph(
                    $"TRILHA: {reports[reportIndex].TrackTitle}",
                    reportIndex > 0));

                for (var stageIndex = 0; stageIndex < reports[reportIndex].Stages.Count; stageIndex++)
                {
                    var stage = reports[reportIndex].Stages[stageIndex];
                    var questionTable = stage.TemplateTable is null
                        ? CreateQuestionTable(stage.Questions)
                        : (Table)stage.TemplateTable.CloneNode(true);
                    PopulateQuestionTable(questionTable, stage.Questions, annexNumbers);
                    sourceBody.Append(CreateStageTitleParagraph(
                        $"META {stage.StageCode} - {stage.Context.StageName}",
                        stageIndex > 0));
                    sourceBody.Append(questionTable);
                }
            }

            uint drawingId = 1;
            AppendAnnexHeading(sourceBody, annexes.Count > 0);
            var addedAnnexes = new HashSet<Guid>();
            foreach (var report in reports)
            {
                foreach (var stage in report.Stages)
                {
                    foreach (var annex in GetUniqueAnnexes(stage.Questions))
                    {
                        if (!addedAnnexes.Add(annex.AnnexId)) continue;

                        AppendAnnexTitle(
                            sourceBody,
                            annexNumbers[annex.AnnexId],
                            annex,
                            $"{report.TrackTitle} - Meta {stage.StageCode}");
                        drawingId = await AppendAnnexImagesAsync(
                            sourceBody,
                            mainPart,
                            report.DocumentId,
                            annex,
                            drawingId,
                            cancellationToken);
                    }
                }
            }

            sourceBody.Append(sectionProperties);
            mainPart.Document.Save();
        }

        var bytes = output.ToArray();
        await output.DisposeAsync();
        return new SoftexDocxExport(
            new MemoryStream(bytes, writable: false),
            DocxContentType,
            reports.Count == 1
                ? $"relatorio-softex-{normalizedStageCodes.Length}-metas.docx"
                : $"relatorio-softex-{reports.Count}-trilhas.docx");
    }

    private static string NormalizeStageCode(string stageCode)
    {
        var normalized = stageCode.Trim().ToUpperInvariant();
        if (!normalized.StartsWith('M')) normalized = $"M{normalized}";
        return normalized;
    }

    private static IReadOnlyList<ExportAnnex> ReadAnnexes(JsonElement annexes)
    {
        if (annexes.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            return [];

        return JsonSerializer.Deserialize<List<ExportAnnex>>(annexes.GetRawText(), JsonOptions)
            ?.Where(annex => annex.AnnexId != Guid.Empty)
            .ToArray()
            ?? [];
    }

    private static IReadOnlyList<ExportAnnex> GetUniqueAnnexes(
        IEnumerable<ExportQuestion> questions)
    {
        var annexes = new List<ExportAnnex>();
        var known = new HashSet<Guid>();
        foreach (var question in questions)
        {
            foreach (var annex in question.Annexes)
            {
                if (known.Add(annex.AnnexId)) annexes.Add(annex);
            }
        }
        return annexes;
    }

    private static Table? FindQuestionTable(Body body)
    {
        return body.Descendants<Table>()
            .FirstOrDefault(table =>
            {
                var cells = table.Elements<TableRow>()
                    .FirstOrDefault()?
                    .Elements<TableCell>()
                    .ToArray();
                return cells is { Length: >= 3 }
                    && cells[0].InnerText.Contains("Termo", StringComparison.OrdinalIgnoreCase)
                    && cells[1].InnerText.Contains("preenchimento", StringComparison.OrdinalIgnoreCase);
            });
    }

    private static SectionProperties? GetTableSectionProperties(Body body, Table? table)
    {
        if (table is null) return null;

        var children = body.ChildElements.ToList();
        var index = children.IndexOf(table);
        for (var position = index - 1; position >= 0; position--)
        {
            var sectionProperties = children[position]
                .Descendants<SectionProperties>()
                .LastOrDefault();
            if (sectionProperties is not null)
                return (SectionProperties)sectionProperties.CloneNode(true);
        }
        return null;
    }

    private static void PopulateQuestionTable(
        Table table,
        IReadOnlyList<ExportQuestion> questions,
        IReadOnlyDictionary<Guid, int> annexNumbers)
    {
        var rows = table.Elements<TableRow>().ToList();
        var dataRows = rows.Skip(1).ToList();

        for (var index = 0; index < questions.Count; index++)
        {
            if (index >= dataRows.Count)
            {
                var row = CreateQuestionRow(questions[index]);
                table.Append(row);
                dataRows.Add(row);
            }

            var cells = dataRows[index].Elements<TableCell>().ToArray();
            if (cells.Length < 3) continue;

            var question = questions[index];
            ReplaceCellText(cells[1], string.IsNullOrWhiteSpace(question.Question.Answer)
                ? "-"
                : question.Question.Answer!);
            ReplaceCellText(cells[2], BuildEvidenceText(question.Annexes, annexNumbers));
        }

        foreach (var unusedRow in dataRows.Skip(questions.Count))
            unusedRow.Remove();
    }

    private static string BuildEvidenceText(
        IReadOnlyList<ExportAnnex> annexes,
        IReadOnlyDictionary<Guid, int> annexNumbers)
    {
        return string.Join(Environment.NewLine, annexes
            .Where(annex => annexNumbers.ContainsKey(annex.AnnexId))
            .Select(annex => $"Anexo {annexNumbers[annex.AnnexId]}: {annex.Title}"));
    }

    private static void ReplaceCellText(TableCell cell, string text)
    {
        var sourceParagraph = cell.Elements<Paragraph>().FirstOrDefault();
        var paragraphProperties = sourceParagraph?.ParagraphProperties?.CloneNode(true) as ParagraphProperties;
        var runProperties = sourceParagraph?.Descendants<RunProperties>().FirstOrDefault()?.CloneNode(true) as RunProperties;

        foreach (var child in cell.ChildElements.Where(child => child is not TableCellProperties).ToList())
            child.Remove();
        cell.Append(CreateTextParagraph(text, paragraphProperties, runProperties));
    }

    private static Paragraph CreateTextParagraph(
        string text,
        ParagraphProperties? paragraphProperties = null,
        RunProperties? runProperties = null)
    {
        var paragraph = new Paragraph();
        if (paragraphProperties is not null) paragraph.Append(paragraphProperties);

        var run = new Run();
        if (runProperties is not null) run.Append(runProperties);

        var lines = text.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n');
        for (var index = 0; index < lines.Length; index++)
        {
            if (index > 0) run.Append(new Break());
            run.Append(new Text(lines[index]) { Space = SpaceProcessingModeValues.Preserve });
        }
        paragraph.Append(run);
        return paragraph;
    }

    private static Paragraph CreateTitleParagraph(string text)
    {
        return CreateTextParagraph(
            text,
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "180" }),
            new RunProperties(new Bold(), new FontSize { Val = "28" }));
    }

    private static Paragraph CreateSubtitleParagraph(string text)
    {
        return CreateTextParagraph(
            text,
            new ParagraphProperties(
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "240" }),
            new RunProperties(new FontSize { Val = "20" }));
    }

    private static Paragraph CreateStageTitleParagraph(string text, bool pageBreakBefore)
    {
        var properties = new ParagraphProperties(
            new SpacingBetweenLines { Before = "180", After = "140" });
        if (pageBreakBefore) properties.Append(new PageBreakBefore());

        return CreateTextParagraph(
            text,
            properties,
            new RunProperties(new Bold(), new FontSize { Val = "24" }));
    }

    private static Table CreateQuestionTable(IReadOnlyList<ExportQuestion> questions)
    {
        var table = new Table(
            new TableProperties(
                new TableWidth { Width = "0", Type = TableWidthUnitValues.Auto },
                new TableLayout { Type = TableLayoutValues.Fixed },
                new TableBorders(
                    new TopBorder { Val = BorderValues.Single, Size = 6U, Color = "808080" },
                    new BottomBorder { Val = BorderValues.Single, Size = 6U, Color = "808080" },
                    new LeftBorder { Val = BorderValues.Single, Size = 6U, Color = "808080" },
                    new RightBorder { Val = BorderValues.Single, Size = 6U, Color = "808080" },
                    new InsideHorizontalBorder { Val = BorderValues.Single, Size = 4U, Color = "BFBFBF" },
                    new InsideVerticalBorder { Val = BorderValues.Single, Size = 4U, Color = "BFBFBF" })),
            new TableGrid(
                new GridColumn { Width = "3900" },
                new GridColumn { Width = "5700" },
                new GridColumn { Width = "2200" }));

        table.Append(CreateHeaderRow());
        foreach (var question in questions)
            table.Append(CreateQuestionRow(question));
        return table;
    }

    private static TableRow CreateHeaderRow()
    {
        return new TableRow(
            CreateCell("Termo", "3900", true),
            CreateCell("Campo de preenchimento", "5700", true),
            CreateCell("Evidências", "2200", true));
    }

    private static TableRow CreateQuestionRow(ExportQuestion question)
    {
        return new TableRow(
            CreateCell(question.Question.QuestionLabel, "3900"),
            CreateCell("-", "5700"),
            CreateCell(string.Empty, "2200"));
    }

    private static TableCell CreateCell(string text, string width, bool isHeader = false)
    {
        var properties = new TableCellProperties(
            new TableCellWidth { Width = width, Type = TableWidthUnitValues.Dxa },
            new TableCellVerticalAlignment { Val = TableVerticalAlignmentValues.Center });
        if (isHeader)
            properties.Append(new Shading { Fill = "D9EAF7", Val = ShadingPatternValues.Clear });

        return new TableCell(
            properties,
            CreateTextParagraph(
                text,
                null,
                isHeader ? new RunProperties(new Bold()) : null));
    }

    private static void AppendAnnexHeading(Body body, bool hasAnnexes)
    {
        body.Append(new Paragraph(
            new ParagraphProperties(
                new PageBreakBefore(),
                new Justification { Val = JustificationValues.Center },
                new SpacingBetweenLines { After = "160" }),
            new Run(
                new RunProperties(new Bold(), new FontSize { Val = "28" }),
                new Text("ANEXOS"))));

        if (!hasAnnexes)
            body.Append(CreateTextParagraph("Nenhum anexo foi adicionado para esta etapa."));
    }

    private static void AppendAnnexTitle(Body body, int number, ExportAnnex annex)
    {
        AppendAnnexTitle(body, number, annex, null);
    }

    private static void AppendAnnexTitle(
        Body body,
        int number,
        ExportAnnex annex,
        string? contextLabel)
    {
        body.Append(CreateTextParagraph(
            string.IsNullOrWhiteSpace(contextLabel)
                ? $"ANEXO {number}: {annex.Title}"
                : $"ANEXO {number} - {contextLabel}: {annex.Title}",
            new ParagraphProperties(new SpacingBetweenLines { Before = "180", After = "80" }),
            new RunProperties(new Bold(), new FontSize { Val = "22" })));

        if (!string.IsNullOrWhiteSpace(annex.SourceReference))
            body.Append(CreateTextParagraph($"Fonte: {annex.SourceReference}"));

        if (annex.Images.Count == 0)
            body.Append(CreateTextParagraph("Nenhuma imagem foi adicionada a este anexo."));
    }

    private async Task<uint> AppendAnnexImagesAsync(
        Body body,
        MainDocumentPart mainPart,
        Guid documentId,
        ExportAnnex annex,
        uint drawingId,
        CancellationToken cancellationToken)
    {
        foreach (var image in annex.Images.OrderBy(image => image.DisplayOrder))
        {
            if (!IsWordSupportedImage(image.MediaType))
            {
                body.Append(CreateTextParagraph(
                    $"Arquivo não incorporado ao DOCX: {image.OriginalFileName} ({image.MediaType})."));
                continue;
            }

            try
            {
                var download = await _reportAttachmentService
                    .DownloadImageAsync(documentId, image.ImageId, cancellationToken);
                await using (download.Content)
                {
                    var imagePart = mainPart.AddImagePart(download.MediaType);
                    imagePart.FeedData(download.Content);
                    var relationshipId = mainPart.GetIdOfPart(imagePart);
                    var (width, height) = GetImageSize(download.Content, download.MediaType);

                    body.Append(new Paragraph(
                        new ParagraphProperties(new SpacingBetweenLines { Before = "80", After = "80" }),
                        new Run(CreateImageDrawing(relationshipId, width, height, drawingId++, image.OriginalFileName))));
                }
            }
            catch (FileNotFoundException)
            {
                body.Append(CreateTextParagraph($"Imagem indisponível: {image.OriginalFileName}."));
            }
        }
        return drawingId;
    }

    private static bool IsWordSupportedImage(string mediaType)
    {
        return mediaType.ToLowerInvariant() is "image/jpeg" or "image/png" or "image/bmp" or "image/tiff";
    }

    private static (long Width, long Height) GetImageSize(Stream content, string mediaType)
    {
        const long maximumWidth = 6_400_800L; // 7 inches in EMUs
        const long maximumHeight = 4_572_000L; // 5 inches in EMUs
        const long emusPerPixelAt96Dpi = 9_525L;

        if (!content.CanSeek) return (maximumWidth, maximumHeight);
        var position = content.Position;
        try
        {
            content.Position = 0;
            using var reader = new BinaryReader(content, System.Text.Encoding.UTF8, leaveOpen: true);
            var (pixelsWidth, pixelsHeight) = mediaType.ToLowerInvariant() switch
            {
                "image/png" => ReadPngSize(reader),
                "image/bmp" => ReadBmpSize(reader),
                "image/jpeg" => ReadJpegSize(reader),
                _ => (0, 0)
            };

            if (pixelsWidth <= 0 || pixelsHeight <= 0) return (maximumWidth, maximumHeight);
            var width = pixelsWidth * emusPerPixelAt96Dpi;
            var height = pixelsHeight * emusPerPixelAt96Dpi;
            var scale = Math.Min(1d, Math.Min((double)maximumWidth / width, (double)maximumHeight / height));
            return ((long)(width * scale), (long)(height * scale));
        }
        catch (EndOfStreamException)
        {
            return (maximumWidth, maximumHeight);
        }
        finally
        {
            content.Position = position;
        }
    }

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

    private sealed record CombinedDocument(
        Guid DocumentId,
        string TrackTitle,
        IReadOnlyList<CombinedStage> Stages);

    private sealed record CombinedStage(
        string StageCode,
        ReportExportContextDTO Context,
        IReadOnlyList<ExportQuestion> Questions,
        Table? TemplateTable);

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
