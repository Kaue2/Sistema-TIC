import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import { EmptySearch } from "../components/molecules/EmptySearch";
import { MultiSelectDropdown } from "../components/molecules/MultiSelectDropdown";
import { SearchInput } from "../components/molecules/SearchInput";
import { SegmentedControl } from "../components/molecules/SegmentedControl";
import { Toast } from "../components/organisms/Toast";
import type { ToastType } from "../components/organisms/Toast";
import { SoftexReportDialog } from "../components/organisms/SoftexReportDialog";
import { TrailCard } from "../components/organisms/TrailCard";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { mockTrails } from "../data/mockTrails";
import { AttachmentService } from "../services/document/AttachmentService";
import type { Trail, TrailModality } from "../types/trail";

const MODALITY_OPTIONS = [
  { label: "Todos", value: "all", icon: "star" },
  { label: "Híbrido", value: "Híbrido", icon: "apartment" },
  { label: "Assíncrono", value: "Assíncrono", icon: "computer" },
];

const SEMESTER_OPTIONS = Array.from(
  new Set(mockTrails.map((trail) => trail.semester))
).map((semester) => ({ label: semester, value: semester }));

const CAREER_OPTIONS = Array.from(
  new Set(mockTrails.map((trail) => trail.career))
).map((career) => ({ label: career, value: career }));

const MENTOR_OPTIONS = Array.from(
  new Set(mockTrails.flatMap((trail) => trail.mentors.map((mentor) => mentor.fullName)))
).map((mentor) => ({ label: mentor, value: mentor }));

const STAGE_OPTIONS = Array.from(
  new Set(mockTrails.map((trail) => trail.stage))
).map((stage) => ({ label: stage, value: stage }));

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function CentralTrilhasPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [modality, setModality] = useState("all");
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(
    null
  );
  const [reportTrail, setReportTrail] = useState<Trail | null>(null);

  const filteredTrails = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return mockTrails.filter((trail) => {
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

  async function exportSoftexReport(stageCodes: string[]) {
    if (!reportTrail || !isUuid(reportTrail.id)) {
      throw new Error("A trilha selecionada ainda n\u00e3o possui um documento Softex no servidor.");
    }

    const document = await AttachmentService.getSoftexDocumentForTrail(reportTrail.id);
    const exportFile = await AttachmentService.exportSoftexReport(document.id, stageCodes);
    const objectUrl = URL.createObjectURL(exportFile.content);
    const link = window.document.createElement("a");
    link.href = objectUrl;
    link.download = exportFile.fileName;
    window.document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);

    setToast({ message: "Relat\u00f3rio DOCX gerado com sucesso.", type: "success" });
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
              onClick={() =>
                setToast({
                  message: "A criação de trilhas será conectada em uma próxima etapa.",
                  type: "info",
                })
              }
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

        {filteredTrails.length > 0 ? (
          <section
            aria-label="Trilhas cadastradas"
            className="mt-[72px] grid gap-x-12 gap-y-4 xl:grid-cols-2"
          >
            {filteredTrails.map((trail) => (
              <TrailCard
                key={trail.id}
                trail={trail}
                onOpen={handleOpenTrail}
                onGenerateReport={setReportTrail}
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

      <SoftexReportDialog
        open={reportTrail !== null}
        trailTitle={reportTrail?.title ?? ""}
        onClose={() => setReportTrail(null)}
        onExport={exportSoftexReport}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
