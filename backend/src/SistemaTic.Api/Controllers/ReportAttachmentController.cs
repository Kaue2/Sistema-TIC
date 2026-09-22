using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaTic.Api.Services;
using SistemaTic.Application.DTO;
using SistemaTic.Application.Services;

namespace SistemaTic.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/documents/{documentId:guid}/attachments")]
public class ReportAttachmentController : ControllerBase
{
    private readonly ReportAttachmentService _service;
    private readonly SoftexDocxExportService _docxExportService;

    public ReportAttachmentController(
        ReportAttachmentService service,
        SoftexDocxExportService docxExportService)
    {
        _service = service;
        _docxExportService = docxExportService;
    }

    [HttpGet("stages/{stageCode}")]
    public async Task<IActionResult> GetStage(
        Guid documentId,
        string stageCode,
        CancellationToken cancellationToken)
    {
        var stage = await _service.GetStageAsync(documentId, stageCode, cancellationToken);
        return stage is null ? NotFound() : Ok(stage);
    }

    [HttpPost("annexes")]
    public async Task<IActionResult> CreateAnnex(
        Guid documentId,
        [FromBody] CreateReportAnnexDTO request,
        CancellationToken cancellationToken)
    {
        try
        {
            var annexId = await _service.CreateAnnexAsync(
                documentId,
                request,
                CurrentUserId(),
                cancellationToken);
            return Ok(new { id = annexId });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPut("answers/{questionCode}")]
    public async Task<IActionResult> SaveAnswer(
        Guid documentId,
        string questionCode,
        [FromBody] SaveReportAnswerDTO request,
        CancellationToken cancellationToken)
    {
        try
        {
            await _service.SaveAnswerAsync(
                documentId,
                questionCode,
                request,
                CurrentUserId(),
                cancellationToken);
            return NoContent();
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpGet("export-data")]
    public async Task<IActionResult> GetExportData(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var questions = await _service.GetExportQuestionsAsync(documentId, cancellationToken);
        return Ok(new { questions });
    }

    [HttpGet("export/{stageCode}/docx")]
    public async Task<IActionResult> ExportDocx(
        Guid documentId,
        string stageCode,
        CancellationToken cancellationToken)
    {
        try
        {
            var export = await _docxExportService.CreateAsync(documentId, stageCode, cancellationToken);
            return File(export.Content, export.ContentType, export.FileName);
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (FileNotFoundException exception)
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: exception.Message);
        }
    }

    [HttpPost("export/docx")]
    public async Task<IActionResult> ExportCombinedDocx(
        Guid documentId,
        [FromBody] CreateSoftexDocxExportDTO request,
        CancellationToken cancellationToken)
    {
        try
        {
            var export = await _docxExportService.CreateCombinedAsync(
                documentId,
                request.StageCodes,
                cancellationToken);
            return File(export.Content, export.ContentType, export.FileName);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (FileNotFoundException exception)
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: exception.Message);
        }
    }

    [HttpPost("/api/reports/softex/export/docx")]
    public async Task<IActionResult> ExportMultiTrailDocx(
        [FromBody] CreateMultiTrailSoftexDocxExportDTO request,
        CancellationToken cancellationToken)
    {
        try
        {
            var export = await _docxExportService.CreateMultiTrailAsync(
                request.DocumentIds,
                request.StageCodes,
                cancellationToken);
            return File(export.Content, export.ContentType, export.FileName);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (FileNotFoundException exception)
        {
            return Problem(statusCode: StatusCodes.Status500InternalServerError, detail: exception.Message);
        }
    }

    [HttpPost("annexes/{annexId:guid}/images")]
    [RequestSizeLimit(314_572_800)]
    public async Task<IActionResult> UploadImages(
        Guid documentId,
        Guid annexId,
        [FromForm] List<IFormFile>? files,
        CancellationToken cancellationToken)
    {
        var streams = new List<Stream>();
        try
        {
            var uploads = (files ?? []).Select(file =>
            {
                var stream = file.OpenReadStream();
                streams.Add(stream);
                return new AttachmentUploadFile(
                    file.FileName,
                    file.ContentType,
                    file.Length,
                    stream);
            }).ToArray();

            await _service.UploadImagesAsync(
                documentId,
                annexId,
                uploads,
                CurrentUserId(),
                cancellationToken);
            return NoContent();
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
        finally
        {
            foreach (var stream in streams) await stream.DisposeAsync();
        }
    }

    [HttpGet("images/{imageId:guid}/content")]
    public async Task<IActionResult> DownloadImage(
        Guid documentId,
        Guid imageId,
        CancellationToken cancellationToken)
    {
        try
        {
            var download = await _service.DownloadImageAsync(documentId, imageId, cancellationToken);
            return File(download.Content, download.MediaType, download.FileName, enableRangeProcessing: true);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("images/{imageId:guid}")]
    public async Task<IActionResult> DeleteImage(
        Guid documentId,
        Guid imageId,
        CancellationToken cancellationToken)
    {
        try
        {
            await _service.DeleteImageAsync(documentId, imageId, CurrentUserId(), cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpDelete("annexes/{annexId:guid}")]
    public async Task<IActionResult> DeleteAnnex(
        Guid documentId,
        Guid annexId,
        CancellationToken cancellationToken)
    {
        try
        {
            await _service.DeleteAnnexAsync(documentId, annexId, CurrentUserId(), cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    private Guid CurrentUserId()
    {
        var identifier = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(identifier, out var userId))
            throw new UnauthorizedAccessException("Token sem identificador de usuário válido.");
        return userId;
    }
}
