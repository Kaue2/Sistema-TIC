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

    public async Task<IEnumerable<TrackSummaryDTO>> GetAllTracksAsync()
    {
        var tracks = await this._trackRepository.GetAllAsync();
        var summaries = new List<TrackSummaryDTO>();

        foreach (var track in tracks)
        {
            KnowledgeArea? knowledgeArea = await this._knowledgeAreaRepository.GetByIdAsync(track.KnowledgeAreaId);
            var mentors = await this._trackTeamMemberRepository.GetActiveMembersAsync(track.Id, "mentor");

            summaries.Add(new TrackSummaryDTO(
                track.Id,
                track.Code,
                track.Title,
                track.Modality,
                track.LearningLevel,
                track.Status,
                knowledgeArea?.Name ?? string.Empty,
                mentors.Select(m => new TrackMentorSummaryDTO(m.FullName, m.Email))));
        }

        return summaries;
    }

    public async Task<IEnumerable<TrackDocumentSummaryDTO>> GetDocumentsByTrackIdAsync(Guid trackId)
    {
        Track? track = await this._trackRepository.GetByIdAsync(trackId);
        if (track is null)
            throw new Exception("Trilha não encontrada");

        KnowledgeArea? knowledgeArea = await this._knowledgeAreaRepository.GetByIdAsync(track.KnowledgeAreaId);
        var documents = await this._trackDocumentRepository.GetByTrackIdAsync(trackId);
        var summaries = new List<TrackDocumentSummaryDTO>();

        foreach (var document in documents)
        {
            DocumentTemplateSummary? template = await this._documentTemplateRepository.GetByIdAsync(document.DocumentTemplateId);

            summaries.Add(new TrackDocumentSummaryDTO(
                document.Id,
                template?.Name ?? string.Empty,
                track.Title,
                knowledgeArea?.Name ?? string.Empty,
                MapDocumentStatus(document.Status)));
        }

        return summaries;
    }

    private static string MapDocumentStatus(string status)
    {
        // "rejected" ainda não tem um status equivalente no front (Rascunho/Em Revisão/Concluído/Arquivado);
        // por ora devolvemos o código crudo até decidirmos a migration que trata isso.
        return status switch
        {
            "draft" => "Rascunho",
            "submitted" => "Em Revisão",
            "changes_requested" => "Em Revisão",
            "approved" => "Concluído",
            _ => status,
        };
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
