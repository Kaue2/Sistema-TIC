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
import { TrailCard } from "../components/organisms/TrailCard";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { CreateTrackModal } from "../components/molecules/CreateTrackModal";
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

export function CentralTrilhasPage() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<TrackSummaryDTO[]>([]);
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
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadTracks = useCallback(async () => {
    try {
      const data = await getTracks();
      setTracks(data);
    } catch {
      setToast({ message: "Não foi possível carregar as trilhas.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const trails = useMemo(() => tracks.map(trackToTrail), [tracks]);

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
                onMore={(selectedTrail) =>
                  setToast({
                    message: `Ações de ${selectedTrail.title} ainda serão conectadas.`,
                    type: "info",
                  })
                }
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
