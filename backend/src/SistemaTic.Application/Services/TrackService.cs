using System.Text.Json;
using System.Text.RegularExpressions;
using SistemaTic.Application.Contracts;
using SistemaTic.Application.DTO;
using SistemaTic.Application.Exceptions;
using SistemaTic.Domain.Entities;

namespace SistemaTic.Application.Services;

public class TrackService
{
    private static readonly Regex SemesterFormat = new(@"\A[0-9]{4}/[12]\z");

    private readonly ITrackRepository _trackRepository;
    private readonly ITrackDocumentRepository _trackDocumentRepository;
    private readonly IDocumentTemplateRepository _documentTemplateRepository;
    private readonly ITrackTeamMemberRepository _trackTeamMemberRepository;
    private readonly ITrackTaskRepository _trackTaskRepository;
    private readonly IKnowledgeAreaRepository _knowledgeAreaRepository;

    public TrackService(
        ITrackRepository trackRepository,
        ITrackDocumentRepository trackDocumentRepository,
        IDocumentTemplateRepository documentTemplateRepository,
        ITrackTeamMemberRepository trackTeamMemberRepository,
        ITrackTaskRepository trackTaskRepository,
        IKnowledgeAreaRepository knowledgeAreaRepository)
    {
        this._trackRepository = trackRepository;
        this._trackDocumentRepository = trackDocumentRepository;
        this._documentTemplateRepository = documentTemplateRepository;
        this._trackTeamMemberRepository = trackTeamMemberRepository;
        this._trackTaskRepository = trackTaskRepository;
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

    public async Task<IEnumerable<TrackTaskDTO>?> GetTasksByTrackIdAsync(Guid trackId)
    {
        Track? track = await this._trackRepository.GetByIdAsync(trackId);
        if (track is null)
            return null;

        var tasks = await this._trackTaskRepository.GetByTrackIdAsync(trackId);

        return tasks.Select(task => new TrackTaskDTO(
            task.Id,
            task.Phase,
            task.Code,
            task.Title,
            task.Description,
            task.Status,
            task.DueAt,
            task.DisplayOrder,
            task.IsRequired));
    }

    public async Task<TrackDocument?> GetSoftexDocumentAsync(Guid trackId)
    {
        return await this._trackDocumentRepository.GetSoftexDocumentByTrackIdAsync(trackId);
    }

    public async Task<IEnumerable<TrackSummaryDTO>> GetAllTracksAsync()
    {
        var tracks = (await this._trackRepository.GetAllAsync()).ToList();
        var knowledgeAreas = (await this._knowledgeAreaRepository.GetByIdsAsync(tracks.Select(t => t.KnowledgeAreaId))).ToDictionary(a => a.Id);
        var mentorsByTrack = await this._trackTeamMemberRepository.GetActiveMentorsByTrackIdsAsync(tracks.Select(t => t.Id), "mentor");

        return tracks.Select(track =>
        {
            knowledgeAreas.TryGetValue(track.KnowledgeAreaId, out KnowledgeArea? knowledgeArea);
            var mentors = mentorsByTrack.GetValueOrDefault(track.Id) ?? new List<TrackMemberSummary>();

            return new TrackSummaryDTO(
                track.Id,
                track.Code,
                track.Title,
                track.Semester,
                track.Modality,
                track.LearningLevel,
                track.Status,
                knowledgeArea?.Name ?? string.Empty,
                mentors.Select(m => new TrackMentorSummaryDTO(m.FullName, m.Email)),
                track.LegacyCode);
        });
    }

    public async Task<IEnumerable<TrackDocumentSummaryDTO>> GetDocumentsByTrackIdAsync(Guid trackId)
    {
        Track? track = await this._trackRepository.GetByIdAsync(trackId);
        if (track is null)
            throw new NotFoundException("Trilha não encontrada");

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
                track.Code,
                track.Title,
                track.Semester,
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

    // Espelha tracks_modality_workload (003_tracks.sql). No banco essa regra é ignorada em status 'draft',
    // que é o status de toda trilha recém-criada, então a criação precisa validar por conta própria.
    private static void ValidateModalityWorkload(CreateTrackDTO dto)
    {
        switch (dto.Modality)
        {
            case "online":
                if (dto.OnlineWorkloadMinutes <= 0)
                    throw new ArgumentException("Trilhas online precisam de carga horária online maior que zero.");
                if (dto.InPersonWorkloadMinutes != 0)
                    throw new ArgumentException("Trilhas online não podem ter carga horária presencial.");
                break;
            case "hybrid":
                if (dto.OnlineWorkloadMinutes <= 0)
                    throw new ArgumentException("Trilhas híbridas precisam de carga horária online maior que zero.");
                if (dto.InPersonWorkloadMinutes <= 0)
                    throw new ArgumentException("Trilhas híbridas precisam de carga horária presencial maior que zero.");
                break;
            default:
                throw new ArgumentException("Regime inválido: use 'online' ou 'hybrid'.");
        }
    }

    // Espelha tracks_semester_format (013_track_semester.sql): AAAA/S, com S = 1 ou 2.
    private static void ValidateSemester(string? semester)
    {
        if (semester is null || !SemesterFormat.IsMatch(semester))
            throw new ArgumentException("Semestre inválido: use o formato AAAA/S (ex.: 2026/1).");
    }

    public async Task<Track> CreateTrackAsync(CreateTrackDTO dto, Guid createdByUserId)
    {
        ValidateModalityWorkload(dto);
        ValidateSemester(dto.Semester);

        var templates = (await this._documentTemplateRepository.GetActivePublishedAsync()).ToList();

        // trilha, coordenador e todos os documentos (Escopo, Plano de Ensino, Softex...) são gravados atomicamente
        return await this._trackRepository.CreateAsync(
            null,
            dto.SourceTrackId,
            dto.KnowledgeAreaId,
            dto.CategoryId,
            dto.Title,
            dto.Semester,
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

    // Mesma regra dos documentos: só quem está ativo na equipe da trilha pode duplicá-la, e por
    // isso o autor da cópia sempre entra na equipe copiada.
    public async Task<Track?> DuplicateTrackAsync(Guid trackId, Guid userId)
    {
        Track? track = await this._trackRepository.GetByIdAsync(trackId);
        if (track is null)
            return null;

        if (!await this._trackTeamMemberRepository.IsActiveMemberAsync(trackId, userId))
            throw new UnauthorizedAccessException("Somente membros da trilha podem duplicá-la.");

        return await this._trackRepository.DuplicateAsync(trackId, userId);
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
