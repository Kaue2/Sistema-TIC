using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaTic.Application.DTO;
using SistemaTic.Application.Services;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TrackController : ControllerBase
{
    private readonly TrackService _trackService;

    public TrackController(TrackService trackService)
    {
        this._trackService = trackService;
    }

    [HttpGet("knowledge-areas")]
    [Authorize]
    public async Task<IEnumerable<KnowledgeArea>> GetKnowledgeAreas()
    {
        return await this._trackService.GetKnowledgeAreasAsync();
    }

    [HttpGet]
    [Authorize]
    public async Task<IEnumerable<TrackSummaryDTO>> GetAll()
    {
        return await this._trackService.GetAllTracksAsync();
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id)
    {
        Track? track = await this._trackService.GetByIdAsync(id);

        if (track is null)
            return NotFound();

        return Ok(track);
    }

    [HttpGet("{id:guid}/documents")]
    [Authorize]
    public async Task<IEnumerable<TrackDocumentSummaryDTO>> GetDocuments(Guid id)
    {
        return await this._trackService.GetDocumentsByTrackIdAsync(id);
    }

    [HttpPost("create-track")]
    [Authorize]
    public async Task<IActionResult> CreateTrack(CreateTrackDTO dto)
    {
        Guid createdByUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        Track track = await this._trackService.CreateTrackAsync(dto, createdByUserId);
        return Ok(track);
    }

    [HttpPost("create-track-team-member")]
    [Authorize]
    public async Task<IActionResult> CreateTrackTeamMember(CreateTrackTeamMemberDTO dto)
    {
        Guid assignedByUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        TrackTeamMember member = await this._trackService.CreateTrackTeamMemberAsync(dto, assignedByUserId);
        return Ok(member);
    }
}
