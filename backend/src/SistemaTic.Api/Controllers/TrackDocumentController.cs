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

        TrackDocumentContentDTO? updated = await this._trackService.SaveTrackDocumentContentAsync(
            id, content.GetRawText(), updatedByUserId);

        if (updated is null)
            return NotFound();

        return Ok(updated);
    }
}
