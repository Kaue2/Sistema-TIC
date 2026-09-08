using SistemaTic.Application.Contracts;
using SistemaTic.Application.DTO;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Services;

public class TrackService
{
    private readonly ITrackRepository _trackRepository;
    private readonly ITrackDocumentRepository _trackDocumentRepository;
    private readonly IDocumentTemplateRepository _documentTemplateRepository;
    private readonly ITrackTeamMemberRepository _trackTeamMemberRepository;
    private readonly IKnowledgeAreaRepository _knowledgeAreaRepository;

    public TrackService(
        ITrackRepository trackRepository,
        ITrackDocumentRepository trackDocumentRepository,
        IDocumentTemplateRepository documentTemplateRepository,
        ITrackTeamMemberRepository trackTeamMemberRepository,
        IKnowledgeAreaRepository knowledgeAreaRepository)
    {
        this._trackRepository = trackRepository;
        this._trackDocumentRepository = trackDocumentRepository;
        this._documentTemplateRepository = documentTemplateRepository;
        this._trackTeamMemberRepository = trackTeamMemberRepository;
        this._knowledgeAreaRepository = knowledgeAreaRepository;
    }

    public async Task<IEnumerable<KnowledgeArea>> GetKnowledgeAreasAsync()
    {
        return await this._knowledgeAreaRepository.GetActiveAsync();
    }

    public async Task<Track?> GetByIdAsync(Guid id)
    {
        return await this._trackRepository.GetByIdAsync(id);
    }

    public async Task<Track> CreateTrackAsync(CreateTrackDTO dto, Guid createdByUserId)
    {
        Track track = await this._trackRepository.CreateAsync(
            null,
            dto.SourceTrackId,
            dto.KnowledgeAreaId,
            dto.CategoryId,
            dto.Title,
            dto.ShortDescription,
            dto.Modality,
            dto.LearningLevel,
            dto.PlannedProductionStartsOn,
            dto.PlannedProductionEndsOn,
            dto.PlannedTrackStartsOn,
            dto.PlannedTrackEndsOn,
            dto.RegistrationStartsAt,
            dto.RegistrationEndsAt,
            dto.OnlineWorkloadMinutes,
            dto.InPersonWorkloadMinutes,
            dto.PlannedCapacity,
            dto.TargetAudience,
            dto.Prerequisites,
            dto.AttendanceRequirementPercent,
            createdByUserId);

        var templates = await this._documentTemplateRepository.GetActivePublishedAsync();
        foreach (var template in templates)
        {
            await this._trackDocumentRepository.CreateAsync(
                track.Id,
                template.DocumentTemplateId,
                template.TemplateVersionId,
                createdByUserId,
                createdByUserId);
        }

        return track;
    }

    public async Task<TrackTeamMember> CreateTrackTeamMemberAsync(CreateTrackTeamMemberDTO dto, Guid assignedByUserId)
    {
        return await this._trackTeamMemberRepository.CreateAsync(
            dto.TrackId,
            dto.UserId,
            dto.Responsibility,
            dto.IsLead,
            dto.StartsOn,
            assignedByUserId);
    }
}
