import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../atoms/Button";
import { CheckboxItem } from "../atoms/CheckboxItem";
import { mockTrails } from "../../data/mockTrails";
import type { Trail, TrailModality } from "../../types/trail";
import { Empty } from "./Empty";
import { MultiSelectDropdown } from "./MultiSelectDropdown";
import type { MultiSelectOption } from "./MultiSelectDropdown";
import { SearchInput } from "./SearchInput";
import { SegmentedControl } from "./SegmentedControl";

const MODALITY_OPTIONS = [
  { label: "Todos", value: "all", icon: "star" },
  { label: "Híbrido", value: "Híbrido", icon: "apartment" },
  { label: "Assíncrono", value: "Assíncrono", icon: "computer" },
];

type TrailSelectorModalProps = {
  open: boolean;
  selectedTrailIds: string[];
  onConfirm: (selectedTrailIds: string[]) => void;
  onCancel: () => void;
  trails?: Trail[];
};

export function TrailSelectorModal({
  open,
  selectedTrailIds,
  onConfirm,
  onCancel,
  trails = mockTrails,
}: TrailSelectorModalProps) {
  const [draft, setDraft] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSemesters, setSelectedSemesters] = useState<string[]>([]);
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [modality, setModality] = useState("all");
  const [prevOpen, setPrevOpen] = useState(open);
  const dialogRef = useRef<HTMLDivElement>(null);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraft(selectedTrailIds);
      setSearch("");
      setSelectedSemesters([]);
      setSelectedCareers([]);
      setModality("all");
    }
  }

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") onCancel();
      }
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onCancel]);

  const semesterOptions = useMemo<MultiSelectOption[]>(
    () =>
      Array.from(new Set(trails.map((trail) => trail.semester))).map(
        (semester) => ({ label: semester, value: semester }),
      ),
    [trails],
  );

  const careerOptions = useMemo<MultiSelectOption[]>(
    () =>
      Array.from(new Set(trails.map((trail) => trail.career))).map((career) => ({
        label: career,
        value: career,
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
      if (!normalizedSearch) return true;

      const searchableContent = [
        trail.title,
        trail.id,
        trail.career,
        trail.semester,
        trail.modality,
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
    selectedSemesters,
    trails,
  ]);

  const filteredIds = filteredTrails.map((trail) => trail.id);
  const allSelected =
    filteredIds.length > 0 && filteredIds.every((id) => draft.includes(id));
  const someSelected = filteredIds.some((id) => draft.includes(id));

  function handleToggle(id: string) {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function handleToggleAll() {
    setDraft((prev) => {
      if (allSelected) {
        return prev.filter((id) => !filteredIds.includes(id));
      }
      return Array.from(new Set([...prev, ...filteredIds]));
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Selecionar trilhas"
        tabIndex={-1}
        className="flex max-h-[85dvh] w-full max-w-4xl flex-col rounded-2xl bg-card-background shadow-lg outline-none"
      >
        <header className="flex items-center justify-between gap-4 p-6 pb-4">
          <h3 className="text-xl font-normal text-black-80">
            Trilhas: Acessos e Vínculos
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="rounded-lg p-1 text-black-40 transition-colors hover:text-black-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, fontVariationSettings: "'wght' 300" }}
            >
              close
            </span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            className="w-full [&_input]:!h-9"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="w-44">
              <MultiSelectDropdown
                label="Semestre"
                icon="hourglass_bottom"
                options={semesterOptions}
                selected={selectedSemesters}
                onChange={setSelectedSemesters}
                size="xs"
              />
            </div>
            <div className="w-64">
              <MultiSelectDropdown
                label="Carreiras"
                icon="flowchart"
                options={careerOptions}
                selected={selectedCareers}
                onChange={setSelectedCareers}
                size="xs"
              />
            </div>
            <SegmentedControl
              options={MODALITY_OPTIONS}
              value={modality}
              onChange={setModality}
            />
          </div>

          {filteredTrails.length > 0 ? (
            <>
              <div className="mt-4 border-b border-black-20 pb-2">
                <CheckboxItem
                  label="Selecionar todas as exibidas"
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={handleToggleAll}
                />
              </div>

              <ul className="flex flex-col gap-0.5 py-2">
                {filteredTrails.map((trail) => {
                  const isChecked = draft.includes(trail.id);
                  return (
                    <li key={trail.id}>
                      <CheckboxItem
                        label={trail.title}
                        checked={isChecked}
                        onChange={() => handleToggle(trail.id)}
                        containerClassName="w-full rounded-lg px-2.5 py-2 transition-colors hover:bg-blue-100/5"
                      >
                        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5">
                          <span className="text-sm font-medium text-blue-100">
                            #{trail.id}
                          </span>
                          <span className="text-sm text-black-80">
                            {trail.title}
                          </span>
                          <span className="text-black-40">|</span>
                          <span className="text-sm text-black-60">
                            {trail.career}
                          </span>
                          <span className="text-black-40">|</span>
                          <span className="text-sm text-black-60">
                            {trail.modality}
                          </span>
                          <span className="text-black-40">|</span>
                          <span className="text-sm text-black-60">
                            {trail.semester}
                          </span>
                        </span>
                      </CheckboxItem>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : trails.length > 0 ? (
            <Empty
              icon="search_off"
              title="Nenhuma trilha encontrada"
              description="Tente alterar os filtros ou os termos da pesquisa."
            />
          ) : (
            <Empty
              icon="route"
              title="Nenhuma trilha cadastrada"
              description="Ainda não existem trilhas disponíveis para seleção."
            />
          )}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-black-20 p-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => onConfirm(draft)}>
            Selecionar
          </Button>
        </footer>
      </div>
    </div>
  );
}