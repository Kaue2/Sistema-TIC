using System.Text.Json;
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

    public async Task<TrackDocument?> GetSoftexDocumentAsync(Guid trackId)
    {
        return await this._trackDocumentRepository.GetSoftexDocumentByTrackIdAsync(trackId);
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

        return await BuildDocumentSummariesAsync(track);
    }

    public async Task<IEnumerable<DocumentosTrilhaDTO>> GetAllTrackDocumentPairsAsync(Guid userId)
    {
        var memberTrackIds = (await this._trackTeamMemberRepository.GetActiveTrackIdsByUserIdAsync(userId)).ToHashSet();
        var tracks = (await this._trackRepository.GetAllAsync()).Where(t => memberTrackIds.Contains(t.Id));
        var pairs = new List<DocumentosTrilhaDTO>();

        foreach (var track in tracks)
        {
            var summaries = await BuildDocumentSummariesAsync(track);

            pairs.Add(new DocumentosTrilhaDTO(
                summaries.FirstOrDefault(s => s.DocumentType == "Escopo e Proposta"),
                summaries.FirstOrDefault(s => s.DocumentType == "Plano de Ensino"),
                summaries.FirstOrDefault(s => s.DocumentType == "Softex")));
        }

        return pairs;
    }

    private async Task<List<TrackDocumentSummaryDTO>> BuildDocumentSummariesAsync(Track track)
    {
        KnowledgeArea? knowledgeArea = await this._knowledgeAreaRepository.GetByIdAsync(track.KnowledgeAreaId);
        var documents = await this._trackDocumentRepository.GetByTrackIdAsync(track.Id);
        var summaries = new List<TrackDocumentSummaryDTO>();

        foreach (var document in documents)
        {
            DocumentTemplateSummary? template = await this._documentTemplateRepository.GetByIdAsync(document.DocumentTemplateId);

            summaries.Add(new TrackDocumentSummaryDTO(
                document.Id,
                MapDocumentType(template),
                track.Title,
                knowledgeArea?.Name ?? string.Empty,
                MapDocumentStatus(document.Status)));
        }

        return summaries;
    }

    public async Task<TrackDocumentContentDTO?> GetTrackDocumentContentAsync(Guid documentId)
    {
        TrackDocument? document = await this._trackDocumentRepository.GetByIdAsync(documentId);
        if (document is null)
            return null;

        return await ToContentDTOAsync(document);
    }

    public async Task<TrackDocumentContentDTO?> SaveTrackDocumentContentAsync(Guid documentId, string content, Guid updatedByUserId)
    {
        TrackDocument? document = await this._trackDocumentRepository.GetByIdAsync(documentId);
        if (document is null)
            return null;

        await EnsureTrackMemberAsync(document, updatedByUserId);
        if (document.Status is "approved" or "rejected" or "archived")
            throw new InvalidOperationException(
                $"O documento está {MapDocumentStatus(document.Status)} e não pode ser editado.");

        TrackDocument updated = await this._trackDocumentRepository.ReplaceContentAsync(documentId, content, updatedByUserId);
        return await ToContentDTOAsync(updated);
    }

    public async Task<TrackDocumentContentDTO?> SubmitTrackDocumentForReviewAsync(Guid documentId, Guid updatedByUserId)
    {
        TrackDocument? document = await this._trackDocumentRepository.GetByIdAsync(documentId);
        if (document is null)
            return null;

        await EnsureTrackMemberAsync(document, updatedByUserId);
        if (document.Status is not ("draft" or "changes_requested"))
            throw new InvalidOperationException(
                $"O documento está {MapDocumentStatus(document.Status)}; só é possível enviar para revisão documentos em rascunho.");

        TrackDocument updated = await this._trackDocumentRepository.SubmitForReviewAsync(documentId, updatedByUserId);
        return await ToContentDTOAsync(updated);
    }

    // Ações de revisão/ciclo de vida do documento: status de origem aceitos e status de destino.
    // Espelha o que o front libera em cada tela (devolver/concluir na revisão, reabrir só de
    // Concluído, arquivar de qualquer status ainda não finalizado, restaurar só de Arquivado).
    private static readonly Dictionary<string, (string[] From, string To)> DocumentTransitions = new()
    {
        ["devolve"] = (["submitted"], "changes_requested"),
        ["close"] = (["submitted"], "approved"),
        ["reopen"] = (["approved"], "submitted"),
        ["archive"] = (["draft", "submitted", "changes_requested"], "archived"),
        ["restore"] = (["archived"], "draft"),
    };

    public async Task<TrackDocumentContentDTO?> TransitionTrackDocumentAsync(
        Guid documentId, string action, Guid updatedByUserId, string? reviewComments = null)
    {
        if (!DocumentTransitions.TryGetValue(action, out var transition))
            throw new ArgumentException($"Ação de documento desconhecida: {action}");

        TrackDocument? document = await this._trackDocumentRepository.GetByIdAsync(documentId);
        if (document is null)
            return null;

        if (action is "archive" or "restore")
            await EnsureTrackMemberAsync(document, updatedByUserId);

        string? comments = string.IsNullOrWhiteSpace(reviewComments) ? null : reviewComments.Trim();
        TrackDocument updated = await this._trackDocumentRepository.TransitionStatusAsync(
            documentId, transition.From, transition.To, updatedByUserId, comments);
        return await ToContentDTOAsync(updated);
    }

    // Só quem está ativo na equipe da trilha do documento pode modificá-lo.
    private async Task EnsureTrackMemberAsync(TrackDocument document, Guid userId)
    {
        if (!await this._trackTeamMemberRepository.IsActiveMemberAsync(document.TrackId, userId))
            throw new UnauthorizedAccessException("Somente membros da trilha podem modificar este documento.");
    }

    private async Task<TrackDocumentContentDTO> ToContentDTOAsync(TrackDocument document)
    {
        DocumentTemplateSummary? template = await this._documentTemplateRepository.GetByIdAsync(document.DocumentTemplateId);
        using JsonDocument parsedContent = JsonDocument.Parse(document.CurrentContent);

        return new TrackDocumentContentDTO(
            document.Id,
            MapDocumentType(template),
            MapDocumentStatus(document.Status),
            parsedContent.RootElement.Clone(),
            document.ReviewComments);
    }

    private static string MapDocumentStatus(string status)
    {
        // Status do banco -> rótulo do front. Um status novo no banco sem entrada aqui segue cru
        // (o front mostra um visual neutro para valores que não conhece).
        return status switch
        {
            "draft" => "Rascunho",
            "submitted" => "Em Revisão",
            "changes_requested" => "Rascunho",
            "approved" => "Concluído",
            "archived" => "Arquivado",
            "rejected" => "Retornado",
            _ => status,
        };
    }

    private static string MapDocumentType(DocumentTemplateSummary? template)
    {
        return template?.Code switch
        {
            "proposal_scope" => "Escopo e Proposta",
            "teaching_plan" => "Plano de Ensino",
            "softex_accountability_report" => "Softex",
            _ => template?.Name ?? string.Empty,
        };
    }

    public async Task<Track> CreateTrackAsync(CreateTrackDTO dto, Guid createdByUserId)
    {
        var templates = (await this._documentTemplateRepository.GetActivePublishedAsync()).ToList();

        // trilha, coordenador e todos os documentos (Escopo, Plano de Ensino, Softex...) são gravados atomicamente
        return await this._trackRepository.CreateAsync(
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
            createdByUserId,
            templates);
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
