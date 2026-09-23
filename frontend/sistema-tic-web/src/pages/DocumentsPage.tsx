import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { SearchInput } from "../components/molecules/SearchInput";
import { SegmentedControl } from "../components/molecules/SegmentedControl";
import { DocumentFilters } from "../components/molecules/DocumentFilters";
import { DocumentCard } from "../components/organisms/DocumentCard";
import { Empty } from "../components/molecules/Empty";
import { EmptySearch } from "../components/molecules/EmptySearch";
import { Toast } from "../components/organisms/Toast";
import { Skeleton } from "../components/atoms/Skeleton";
import type { ToastType } from "../components/organisms/Toast";
import type { Document, DocumentType, TeachingMode } from "../types/document";
import { SEMESTER_OPTIONS, CAREER_OPTIONS, TRAIL_OPTIONS } from "../data/mockDocuments";
import {
  getAllTrackDocuments,
  type TrackDocumentSummaryDTO,
} from "../services/document-services";

// number/semester/teachingMode ainda não existem no backend (só track_documents.status,
// document_templates.name, tracks.title/knowledge_area) — ficam em branco em vez de inventados,
// até decidirmos se/como modelar isso. Ver memória "document forms backend".
function toDocument(summary: TrackDocumentSummaryDTO): Document {
  return {
    id: summary.id,
    number: "",
    title: summary.documentType,
    type: summary.documentType as DocumentType,
    trail: summary.trackTitle,
    semester: "",
    career: summary.knowledgeAreaName,
    teachingMode: "" as unknown as TeachingMode,
    status: summary.status as Document["status"],
  };
}

const TYPE_OPTIONS = [
  { label: "Todos", value: "all", icon: "star" },
  { label: "Escopo e Proposta", value: "Escopo e Proposta", icon: "assignment" },
  { label: "Plano de Ensino", value: "Plano de Ensino", icon: "school" },
  { label: "Softex", value: "Softex", icon: "business_center" },
];

export function DocumentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trailFromShortcut = searchParams.get("trail");
  const initialTrail = TRAIL_OPTIONS.find(
    (trail) => trail.value === trailFromShortcut
  )?.value;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => initialTrail ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    () => initialTrail ?? ""
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [selectedTrails, setSelectedTrails] = useState<string[]>(() =>
    initialTrail ? [initialTrail] : []
  );
  const [teachingMode, setTeachingMode] = useState<TeachingMode | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const pairs = await getAllTrackDocuments();
      const flattened = pairs.flatMap((pair) =>
        [
          pair.escopoPropostaDaTrilha,
          pair.planoEnsinoDaTrilha,
          pair.softexDaTrilha,
        ]
          .filter((doc): doc is TrackDocumentSummaryDTO => doc !== null)
          .map(toDocument)
      );
      setDocuments(flattened);
    } catch {
      setToast({ message: "Não foi possível carregar os documentos.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
    }, 300);
  }

  function handleClearSearch() {
    setSearch("");
    setDebouncedSearch("");
  }

  function handleClearAll() {
    setSearch("");
    setDebouncedSearch("");
    setTypeFilter("all");
    setSelectedSemesters([]);
    setSelectedCareers([]);
    setSelectedTrails([]);
    setTeachingMode(null);
  }

  const filteredDocuments = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return documents.filter((doc) => {
      if (typeFilter !== "all" && doc.type !== (typeFilter as DocumentType)) {
        return false;
      }
      if (
        selectedSemesters.length > 0 &&
        !selectedSemesters.includes(doc.semester)
      ) {
        return false;
      }
      if (
        selectedCareers.length > 0 &&
        !selectedCareers.includes(doc.career)
      ) {
        return false;
      }
      if (
        selectedTrails.length > 0 &&
        !selectedTrails.includes(doc.trail)
      ) {
        return false;
      }
      if (teachingMode && doc.teachingMode !== teachingMode) {
        return false;
      }
      if (term) {
        const haystack =
          `${doc.title} ${doc.number} ${doc.trail} ${doc.semester}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [
    documents,
    debouncedSearch,
    typeFilter,
    selectedSemesters,
    selectedCareers,
    selectedTrails,
    teachingMode,
  ]);

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 ||
    typeFilter !== "all" ||
    selectedSemesters.length > 0 ||
    selectedCareers.length > 0 ||
    selectedTrails.length > 0 ||
    teachingMode !== null;

  const showEmpty = documents.length === 0;
  const showEmptySearch =
    !showEmpty && filteredDocuments.length === 0 && hasActiveFilters;
  const showDocuments = !showEmpty && !showEmptySearch;

  function handleArchive(doc: Document) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status: "Arquivado" } : d))
    );
    setToast({ message: "Documento arquivado.", type: "success" });
  }

  function handleRestore(doc: Document) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status: "Rascunho" } : d))
    );
    setToast({ message: "Documento restaurado para rascunho.", type: "success" });
  }

  function handleEdit(doc: Document) {
    navigate(`/documents/${doc.id}/edit?type=${encodeURIComponent(doc.type)}`);
  }

  return (
    <div className="relative min-h-screen bg-background">
      <FixedNavigation
        position="left"
        items={[
          { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
          { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
          { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: true },
          { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
          { id: "profile", label: "", icon: "account_circle", route: "/profile", enabled: true, visible: true, notification: false, active: false, avatar: true },
        ]}
      />

      {loading ? (
        <main className="relative mx-auto flex min-h-screen w-full max-w-350 flex-col items-center px-12 pb-16 pt-12">
          <div className="mt-6 flex w-full flex-wrap items-center gap-4">
            <Skeleton className="h-10 min-w-0 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-136.5 max-w-full shrink-0 rounded-lg" />
          </div>
          <div className="mt-6 flex w-full flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-36 shrink-0 rounded-lg" />
            <Skeleton className="h-10 min-w-0 flex-1 rounded-lg" />
            <Skeleton className="h-10 min-w-0 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-61.25 shrink-0 rounded-lg" />
          </div>
          <div className="mt-40 grid w-full grid-cols-[repeat(auto-fit,minmax(min(480px,100%),1fr))] gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-34 w-full rounded-2xl" />
            ))}
          </div>
        </main>
      ) : (
        <main className="relative mx-auto flex min-h-screen w-full max-w-350 flex-col items-center px-12 pb-16 pt-12">
          <div className="mt-6 flex w-full flex-wrap items-center gap-4">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              className="min-w-0 flex-1"
            />
            <SegmentedControl
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>

          <div className="mt-6 flex w-full justify-center">
            <DocumentFilters
              semesters={SEMESTER_OPTIONS}
              selectedSemesters={selectedSemesters}
              onSemestersChange={setSelectedSemesters}
              careers={CAREER_OPTIONS}
              selectedCareers={selectedCareers}
              onCareersChange={setSelectedCareers}
              trails={TRAIL_OPTIONS}
              selectedTrails={selectedTrails}
              onTrailsChange={setSelectedTrails}
              teachingMode={teachingMode}
              onTeachingModeChange={setTeachingMode}
            />
          </div>

          <div className="mt-8 flex w-full justify-center">
            {showEmpty && (
              <Empty
                icon="description"
                iconTinted
                title="Nenhum documento cadastrado"
                description="Os documentos são gerados automaticamente junto com a trilha."
                actionLabel="Nova Trilha"
                onAction={() => navigate("/trails")}
              />
            )}

            {showEmptySearch && (
              <EmptySearch title="Nenhum documento encontrado" onClear={handleClearAll} />
            )}

            {showDocuments && (
              <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(480px,100%),1fr))] gap-4 gap-x-12 mt-30">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onEdit={handleEdit}
                    onArchive={handleArchive}
                    onRestore={handleRestore}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      )}

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
