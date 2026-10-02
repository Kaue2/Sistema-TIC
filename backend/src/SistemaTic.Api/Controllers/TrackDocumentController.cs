using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaTic.Application.DTO;
using SistemaTic.Application.Services;

namespace SistemaTic.Api.Controllers;

[Route("api/track-documents")]
[ApiController]
public class TrackDocumentController : ControllerBase
{
    private readonly TrackService _trackService;

    public TrackDocumentController(TrackService trackService)
    {
        this._trackService = trackService;
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetContent(Guid id)
    {
        TrackDocumentContentDTO? content = await this._trackService.GetTrackDocumentContentAsync(id);

        if (content is null)
            return NotFound();

        return Ok(content);
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> SaveContent(Guid id, [FromBody] JsonElement content)
    {
        Guid updatedByUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        try
        {
            TrackDocumentContentDTO? updated = await this._trackService.SaveTrackDocumentContentAsync(
                id, content.GetRawText(), updatedByUserId);

            if (updated is null)
                return NotFound();

            return Ok(updated);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}/submit")]
    [Authorize]
    public async Task<IActionResult> SubmitForReview(Guid id)
    {
        Guid updatedByUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        try
        {
            TrackDocumentContentDTO? updated = await this._trackService.SubmitTrackDocumentForReviewAsync(id, updatedByUserId);

            if (updated is null)
                return NotFound();

            return Ok(updated);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}/devolve")]
    [Authorize(Roles = "coordinator,administrator")]
    public Task<IActionResult> Devolve(Guid id, [FromBody] DevolveTrackDocumentDTO? dto)
        => Transition(id, "devolve", dto?.Observation);

    [HttpPut("{id:guid}/close")]
    [Authorize(Roles = "coordinator,administrator")]
    public Task<IActionResult> Close(Guid id) => Transition(id, "close");

    [HttpPut("{id:guid}/reopen")]
    [Authorize(Roles = "coordinator,administrator")]
    public Task<IActionResult> Reopen(Guid id) => Transition(id, "reopen");

    [HttpPut("{id:guid}/archive")]
    [Authorize]
    public Task<IActionResult> Archive(Guid id) => Transition(id, "archive");

    [HttpPut("{id:guid}/restore")]
    [Authorize]
    public Task<IActionResult> Restore(Guid id) => Transition(id, "restore");

    private async Task<IActionResult> Transition(Guid id, string action, string? reviewComments = null)
    {
        Guid updatedByUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        try
        {
            TrackDocumentContentDTO? updated = await this._trackService.TransitionTrackDocumentAsync(
                id, action, updatedByUserId, reviewComments);

            if (updated is null)
                return NotFound();

            return Ok(updated);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }
}
