import { useEffect, useState } from "react";
import { Button } from "../atoms/Button";

const REPORT_STAGES = [
  { code: "M1.13", name: "Materiais instrucionais" },
  { code: "M1.14", name: "Objetos de aprendizagem" },
  { code: "M1.15", name: "LMS e recursos t\u00e9cnicos" },
  { code: "M1.18", name: "Materiais audiovisuais e did\u00e1ticos" },
  { code: "M1.19", name: "Conte\u00fados na plataforma virtual" },
  { code: "M1.20", name: "Perfis e m\u00e9todos de sele\u00e7\u00e3o" },
  { code: "M2.1", name: "Processo seletivo" },
  { code: "M2.2", name: "Oferta das capacita\u00e7\u00f5es" },
  { code: "M2.3", name: "Acompanhamento pedag\u00f3gico" },
  { code: "M2.4", name: "Indicadores pedag\u00f3gicos" },
  { code: "M2.5", name: "Desempenho dos estudantes" },
  { code: "M2.6", name: "Emiss\u00e3o de microcredenciais" },
] as const;

type SoftexReportDialogProps = {
  open: boolean;
  trailTitle?: string;
  trailTitles?: string[];
  onClose: () => void;
  onExport: (stageCodes: string[]) => Promise<void>;
};

export function SoftexReportDialog({
  open,
  trailTitle = "",
  trailTitles,
  onClose,
  onExport,
}: SoftexReportDialogProps) {
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setSelectedStages([]);
    setError(undefined);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isExporting) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExporting, onClose, open]);

  if (!open) return null;

  const selectedTrailTitles = trailTitles ?? (trailTitle ? [trailTitle] : []);
  const allSelected = selectedStages.length === REPORT_STAGES.length;

  function toggleStage(code: string) {
    setError(undefined);
    setSelectedStages((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    );
  }

  function toggleAll() {
    setError(undefined);
    setSelectedStages(allSelected ? [] : REPORT_STAGES.map((stage) => stage.code));
  }

  async function handleExport() {
    if (selectedStages.length === 0) {
      setError("Selecione ao menos uma meta para gerar o relat\u00f3rio.");
      return;
    }

    setIsExporting(true);
    setError(undefined);
    try {
      await onExport(selectedStages);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error
        ? caught.message
        : "N\u00e3o foi poss\u00edvel gerar o relat\u00f3rio. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isExporting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="softex-report-title"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col rounded-2xl border border-blue-100/20 bg-card-background shadow-2xl"
      >
        <header className="flex items-start justify-between gap-6 border-b border-black-20 px-6 py-5 sm:px-8">
          <div>
            <p className="text-sm text-blue-100">Relat&oacute;rio Softex</p>
            <h2 id="softex-report-title" className="mt-1 text-2xl font-normal text-black-80">
              Escolha as metas do relat&oacute;rio
            </h2>
            <p className="mt-2 text-sm text-black-60">
              {selectedTrailTitles.length === 1
                ? selectedTrailTitles[0]
                : `${selectedTrailTitles.length} trilhas selecionadas`}
            </p>
            {selectedTrailTitles.length > 1 && (
              <p
                className="mt-1 max-w-xl truncate text-xs text-black-40"
                title={selectedTrailTitles.join(", ")}
              >
                {selectedTrailTitles.join(" • ")}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Fechar"
            disabled={isExporting}
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-black-60 transition-colors hover:bg-blue-100/10 hover:text-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-black-60">
              As perguntas, respostas e anexos das metas selecionadas ser&atilde;o reunidos para todas as trilhas em um &uacute;nico arquivo DOCX.
            </p>
            <button
              type="button"
              onClick={toggleAll}
              className="shrink-0 text-sm text-blue-100 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
            >
              {allSelected ? "Limpar sele\u00e7\u00e3o" : "Selecionar todas"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group" aria-label="Metas Softex">
            {REPORT_STAGES.map((stage) => {
              const isSelected = selectedStages.includes(stage.code);
              return (
                <label
                  key={stage.code}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    isSelected
                      ? "border-blue-100 bg-blue-100/10"
                      : "border-black-20 hover:border-blue-100/50 hover:bg-blue-100/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleStage(stage.code)}
                    className="size-4 accent-blue-100"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-blue-100">Meta {stage.code}</span>
                    <span className="block truncate text-xs text-black-60">{stage.name}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {error && <p role="alert" className="mt-4 text-sm text-red-100">{error}</p>}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-black-20 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
          <Button variant="outline" disabled={isExporting} onClick={onClose} className="justify-center">
            Cancelar
          </Button>
          <Button
            variant="primary"
            icon="download"
            disabled={isExporting}
            onClick={() => void handleExport()}
            className="justify-center"
          >
            {isExporting ? "Gerando DOCX..." : "Exportar DOCX"}
          </Button>
        </footer>
      </section>
    </div>
  );
}
