import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import { Skeleton } from "../components/atoms/Skeleton";
import { EmptySearch } from "../components/molecules/EmptySearch";
import { MultiSelectDropdown } from "../components/molecules/MultiSelectDropdown";
import { SearchInput } from "../components/molecules/SearchInput";
import { SegmentedControl } from "../components/molecules/SegmentedControl";
import { Toast } from "../components/organisms/Toast";
import type { ToastType } from "../components/organisms/Toast";
import { SoftexReportDialog } from "../components/organisms/SoftexReportDialog";
import { TrailCard } from "../components/organisms/TrailCard";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { AttachmentService } from "../services/document/AttachmentService";
import { CreateTrackModal } from "../components/molecules/CreateTrackModal";
import { mockTrails } from "../data/mockTrails";
import { getTracks, type TrackSummaryDTO } from "../services/track-services";
import type { Trail, TrailModality, TrailStage } from "../types/trail";

const MODALITY_OPTIONS = [
  { label: "Todos", value: "all", icon: "star" },
  { label: "Híbrido", value: "Híbrido", icon: "apartment" },
  { label: "Assíncrono", value: "Assíncrono", icon: "computer" },
];

const MODALITY_LABELS: Record<string, TrailModality> = {
  online: "Assíncrono",
  hybrid: "Híbrido",
};

const STATUS_TO_STAGE: Record<string, TrailStage> = {
  draft: "Pré Trilha",
  planning: "Pré Trilha",
  production: "Pré Execução",
  pre_track: "Pré Execução",
  running: "Execução Trilha",
  post_track: "Pós Trilha",
  completed: "Pós Trilha",
  cancelled: "Pós Trilha",
};

// semestre ainda não existe no back (tracks não tem essa coluna); fica com um valor fixo só
// pra manter o layout do card até o time decidir o que fazer com isso.
const NOT_AVAILABLE = "Não informado";

function trackToTrail(track: TrackSummaryDTO): Trail {
  const mentors =
    track.mentors.length > 0
      ? track.mentors.map((mentor) => ({
          id: mentor.email,
          fullName: mentor.fullName,
          role: "mentor",
          email: mentor.email,
        }))
      : [{ id: "placeholder", fullName: NOT_AVAILABLE, role: "", email: "" }];

  return {
    id: String(track.code),
    backendId: track.id,
    title: track.title,
    icon: "route",
    career: track.knowledgeAreaName,
    mentors,
    semester: NOT_AVAILABLE,
    modality: MODALITY_LABELS[track.modality] ?? "Assíncrono",
    level: track.learningLevel ?? "",
    stage: STATUS_TO_STAGE[track.status] ?? "Pré Trilha",
    description: "",
    progress: [],
  };
}

function trailSelectionKey(trail: Trail) {
  return trail.backendId ?? `mock:${trail.id}`;
}

export function CentralTrilhasPage() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<TrackSummaryDTO[]>([]);
  const [useMockTrails, setUseMockTrails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modality, setModality] = useState("all");
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );
  const [reportSelectionMode, setReportSelectionMode] = useState(false);
  const [selectedTrailKeys, setSelectedTrailKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadTracks = useCallback(async () => {
    try {
      const data = await getTracks();
      setTracks(data);
      setUseMockTrails(data.length === 0);
    } catch {
      setTracks([]);
      setUseMockTrails(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const trails = useMemo(
    () => (useMockTrails ? mockTrails : tracks.map(trackToTrail)),
    [tracks, useMockTrails],
  );

  const selectedTrails = useMemo(
    () => trails.filter((trail) => selectedTrailKeys.has(trailSelectionKey(trail))),
    [selectedTrailKeys, trails],
  );

  const SEMESTER_OPTIONS = useMemo(
    () =>
      Array.from(new Set(trails.map((trail) => trail.semester))).map(
        (semester) => ({ label: semester, value: semester }),
      ),
    [trails],
  );

  const CAREER_OPTIONS = useMemo(
    () =>
      Array.from(new Set(trails.map((trail) => trail.career))).map((career) => ({
        label: career,
        value: career,
      })),
    [trails],
  );

  const MENTOR_OPTIONS = useMemo(
    () =>
      Array.from(
        new Set(trails.flatMap((trail) => trail.mentors.map((mentor) => mentor.fullName))),
      ).map((mentor) => ({ label: mentor, value: mentor })),
    [trails],
  );

  const STAGE_OPTIONS = useMemo(
    () =>
      Array.from(new Set(trails.map((trail) => trail.stage))).map((stage) => ({
        label: stage,
        value: stage,
      })),
    [trails],
  );

  const filteredTrails = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return trails.filter((trail) => {
      if (modality !== "all" && trail.modality !== (modality as TrailModality)) {
        return false;
      }
      if (
        selectedSemesters.length > 0 &&
        !selectedSemesters.includes(trail.semester)
      ) {
        return false;
      }
      if (
        selectedCareers.length > 0 &&
        !selectedCareers.includes(trail.career)
      ) {
        return false;
      }
      if (
        selectedMentors.length > 0 &&
        !trail.mentors.some((mentor) => selectedMentors.includes(mentor.fullName))
      ) {
        return false;
      }
      if (selectedStages.length > 0 && !selectedStages.includes(trail.stage)) {
        return false;
      }
      if (!normalizedSearch) return true;

      const searchableContent = [
        trail.title,
        trail.id,
        trail.career,
        trail.semester,
        trail.modality,
        trail.stage,
        ...trail.mentors.map((mentor) => mentor.fullName),
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchableContent.includes(normalizedSearch);
    });
  }, [
    trails,
    modality,
    search,
    selectedCareers,
    selectedMentors,
    selectedSemesters,
    selectedStages,
  ]);

  function handleClearFilters() {
    setSearch("");
    setModality("all");
    setSelectedSemesters([]);
    setSelectedCareers([]);
    setSelectedMentors([]);
    setSelectedStages([]);
  }

  function handleOpenTrail(trail: Trail) {
    navigate(`/trails/${trail.id}`);
  }

  function startReportSelection(trail: Trail) {
    setReportSelectionMode(true);
    setSelectedTrailKeys(new Set([trailSelectionKey(trail)]));
  }

  function toggleTrailSelection(trail: Trail) {
    const key = trailSelectionKey(trail);
    setSelectedTrailKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function cancelReportSelection() {
    setReportDialogOpen(false);
    setReportSelectionMode(false);
    setSelectedTrailKeys(new Set());
  }

  async function exportSoftexReport(stageCodes: string[]) {
    if (selectedTrails.length === 0) {
      throw new Error("Selecione ao menos uma trilha para gerar o relat\u00f3rio.");
    }

    const trailsWithoutBackend = selectedTrails.filter((trail) => !trail.backendId);
    if (trailsWithoutBackend.length > 0) {
      throw new Error(
        "As trilhas de demonstra\u00e7\u00e3o n\u00e3o possuem perguntas, respostas e anexos persistidos no servidor. Inicie a API e selecione trilhas cadastradas para exportar."
      );
    }

    const documents = await Promise.all(
      selectedTrails.map((trail) =>
        AttachmentService.getSoftexDocumentForTrail(trail.backendId!)
      )
    );
    const exportFile = await AttachmentService.exportSoftexReports(
      documents.map((document) => document.id),
      stageCodes
    );
    const objectUrl = URL.createObjectURL(exportFile.content);
    const link = window.document.createElement("a");
    link.href = objectUrl;
    link.download = exportFile.fileName;
    window.document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);

    setToast({ message: "Relat\u00f3rio DOCX gerado com sucesso.", type: "success" });
    cancelReportSelection();
  }

  return (
    <div className="min-h-screen bg-background">
      <FixedNavigation
        position="left"
        items={[
          { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
          { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: true },
          { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: false },
          { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
          { id: "profile", label: "", icon: "account_circle", route: "/profile/1", enabled: true, visible: true, notification: false, active: false, avatar: true },
        ]}
      />

      <main className="relative mx-auto w-full max-w-300 px-6 pb-7 pt-[84px] xl:px-0">
        <h1 className="text-center text-[48px] font-normal leading-none text-blue-100">
          Central de Trilhas
        </h1>

        <section aria-label="Filtros de trilhas" className="mt-[68px]">
          <div className="grid gap-4 xl:grid-cols-[526px_360px_282px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              className="w-full [&_input]:!h-9"
            />
            <SegmentedControl
              options={MODALITY_OPTIONS}
              value={modality}
              onChange={setModality}
              fill
            />
            <Button
              variant="primary"
              icon="add_circle"
              onClick={() => setCreateModalOpen(true)}
              className="!h-9 !w-full !justify-center !rounded-lg"
            >
              Nova Trilha
            </Button>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[150px_360px_360px_282px]">
            <MultiSelectDropdown
              label="Semestre"
              icon="hourglass_bottom"
              options={SEMESTER_OPTIONS}
              selected={selectedSemesters}
              onChange={setSelectedSemesters}
              size="xs"
            />
            <MultiSelectDropdown
              label="Carreiras"
              icon="flowchart"
              options={CAREER_OPTIONS}
              selected={selectedCareers}
              onChange={setSelectedCareers}
              size="xs"
            />
            <MultiSelectDropdown
              label="Mentoria"
              icon="group"
              options={MENTOR_OPTIONS}
              selected={selectedMentors}
              onChange={setSelectedMentors}
              size="xs"
            />
            <MultiSelectDropdown
              label="Status"
              icon="radio_button_unchecked"
              options={STAGE_OPTIONS}
              selected={selectedStages}
              onChange={setSelectedStages}
              size="xs"
            />
          </div>
        </section>

        {loading ? (
          <div className="mt-[72px] grid gap-x-12 gap-y-4 xl:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredTrails.length > 0 ? (
          <section
            aria-label="Trilhas cadastradas"
            className="mt-[72px] grid gap-x-12 gap-y-4 xl:grid-cols-2"
          >
            {filteredTrails.map((trail) => (
              <TrailCard
                key={trail.id}
                trail={trail}
                onOpen={handleOpenTrail}
                selectionMode={reportSelectionMode}
                selected={selectedTrailKeys.has(trailSelectionKey(trail))}
                onStartReportSelection={startReportSelection}
                onToggleSelection={toggleTrailSelection}
              />
            ))}
          </section>
        ) : (
          <EmptySearch
            title="Nenhuma trilha encontrada"
            onClear={handleClearFilters}
          />
        )}
      </main>

      {reportSelectionMode && !reportDialogOpen && (
        <aside
          aria-label="Seleção de trilhas para relatório"
          className="fixed bottom-6 left-1/2 z-[1050] flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col gap-4 rounded-2xl border border-blue-100/20 bg-card-background px-5 py-4 shadow-2xl sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-blue-100">
              {selectedTrails.length} {selectedTrails.length === 1 ? "trilha selecionada" : "trilhas selecionadas"}
            </p>
            <p className="mt-1 truncate text-sm text-black-60">
              Clique nos cards para adicionar ou remover trilhas.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button variant="outline" onClick={cancelReportSelection} className="justify-center">
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon="arrow_forward"
              disabled={selectedTrails.length === 0}
              onClick={() => setReportDialogOpen(true)}
              className="justify-center"
            >
              Continuar para metas
            </Button>
          </div>
        </aside>
      )}

      <SoftexReportDialog
        open={reportDialogOpen}
        trailTitles={selectedTrails.map((trail) => `${trail.title} #${trail.id}`)}
        onClose={() => setReportDialogOpen(false)}
        onExport={exportSoftexReport}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <CreateTrackModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(track) => {
          setCreateModalOpen(false);
          setToast({ message: `Trilha ${track.title} #${track.code} criada com sucesso.`, type: "success" });
          loadTracks();
        }}
      />
    </div>
  );
}
