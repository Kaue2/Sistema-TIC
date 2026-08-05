import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { SearchInput } from "../components/molecules/SearchInput";
import { SegmentedControl } from "../components/molecules/SegmentedControl";
import { CreateDocumentButton } from "../components/molecules/CreateDocumentButton";
import { DocumentFilters } from "../components/molecules/DocumentFilters";
import { DocumentCard } from "../components/organisms/DocumentCard";
import { Empty } from "../components/molecules/Empty";
import { EmptySearch } from "../components/molecules/EmptySearch";
import { Toast } from "../components/organisms/Toast";
import { Skeleton } from "../components/atoms/Skeleton";
import type { ToastType } from "../components/organisms/Toast";
import type { Document, DocumentType, TeachingMode } from "../types/document";
import { mockDocuments, SEMESTER_OPTIONS, CAREER_OPTIONS, TRAIL_OPTIONS } from "../data/mockDocuments";

const TYPE_OPTIONS = [
  { label: "Todos", value: "all", icon: "star" },
  { label: "Escopo e Proposta", value: "Escopo e Proposta", icon: "assignment" },
  { label: "Plano de Ensino", value: "Plano de Ensino", icon: "school" },
  { label: "Softex", value: "Softex", icon: "business_center" },
];

const CREATE_TYPE_OPTIONS = TYPE_OPTIONS.filter((opt) => opt.value !== "all");

export function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [selectedTrails, setSelectedTrails] = useState<string[]>([]);
  const [teachingMode, setTeachingMode] = useState<TeachingMode | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

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

  function handleDuplicate(doc: Document) {
    const nextNumber = parseInt(doc.number.replace("#", ""), 10) + 1;
    const copy: Document = {
      ...doc,
      id: crypto.randomUUID(),
      number: `#${nextNumber}`,
      status: "Rascunho",
    };
    setDocuments((prev) => [copy, ...prev]);
    setToast({ message: "Documento duplicado.", type: "success" });
  }

  function handleArchive(doc: Document) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status: "Arquivado" } : d))
    );
    setToast({ message: "Documento arquivado.", type: "success" });
  }

  function handleEdit(doc: Document) {
    navigate(`/documents/${doc.id}`);
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
            <CreateDocumentButton />
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
                description="Comece criando o primeiro documento da sua trilha."
              >
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {CREATE_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        navigate(`/documents/new?type=${encodeURIComponent(opt.value)}`)
                      }
                      className="flex h-9 items-center gap-2 rounded-lg border border-blue-100 px-4 text-sm text-blue-100 transition-colors hover:bg-blue-100 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18 }}
                      >
                        {opt.icon}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Empty>
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
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
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
