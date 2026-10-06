import { useEffect, useState } from "react";
import { Button } from "../atoms/Button";

import { AttachmentService, attachmentErrorMessage } from "../../services/document/AttachmentService";
import type { ReportStage } from "../../types/attachment";

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
  const [stages, setStages] = useState<ReportStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setSelectedStages([]);
      setStages([]);
      setError(undefined);
      setLoading(true);
      try {
        const catalog = await AttachmentService.getReportStages();
        if (!cancelled) setStages(catalog);
      } catch (caught) {
        const message = await attachmentErrorMessage(caught);
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
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
  const available = stages.filter((stage) => stage.canExport);
  const allSelected = available.length > 0 && selectedStages.length === available.length;

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
    setSelectedStages(allSelected ? [] : available.map((stage) => stage.code));
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
              Cada meta gera um DOCX editável com todas as trilhas selecionadas. Várias metas são entregues em um ZIP.
            </p>
            <button
              type="button"
              onClick={toggleAll}
              disabled={loading || isExporting || available.length === 0}
              className="shrink-0 text-sm text-blue-100 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
            >
              {allSelected ? "Limpar sele\u00e7\u00e3o" : "Selecionar todas"}
            </button>
          </div>

          {loading && <p role="status" className="mt-4 text-sm text-black-60">Carregando metas...</p>}
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="group" aria-label="Metas Softex">
            {stages.map((stage) => {
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
                    disabled={!stage.canExport || isExporting}
                    onChange={() => toggleStage(stage.code)}
                    className="size-4 accent-blue-100"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-blue-100">Meta {stage.code}</span>
                    <span className="block truncate text-xs text-black-60">{stage.name}</span>
                    {!stage.canExport && <span className="block text-xs text-black-40">Modelo indisponível</span>}
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
            disabled={isExporting || loading || selectedStages.length === 0}
            onClick={() => void handleExport()}
            className="justify-center"
          >
            {isExporting ? "Gerando..." : selectedStages.length > 1 ? "Exportar ZIP" : "Exportar DOCX"}
          </Button>
        </footer>
      </section>
    </div>
  );
}
