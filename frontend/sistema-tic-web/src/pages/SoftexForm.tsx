import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DocumentHeader } from "../components/organisms/DocumentHeader";
import { ConfirmDialog } from "../components/molecules/ConfirmDialog";
import { MetaNavigation } from "../components/molecules/MetaNavigation";
import { SoftexOverview } from "../components/molecules/SoftexOverview";
import { SoftexPhaseGroup } from "../components/molecules/SoftexPhaseGroup";
import { Textarea } from "../components/atoms/Textarea";
import { useDocumentForm } from "../hooks/useDocumentForm";
import { useDocumentEditorActions } from "../hooks/useDocumentEditorActions";
import {
  emptySoftexContent,
  type StoredDocument,
} from "../services/document/DocumentService";
import {
  validateSoftexContent,
  validateSoftexContentRequired,
  hasSoftexErrors,
  type SoftexErrors,
} from "../services/document/SoftexValidation";
import { SOFTEX_PROGRESS_INDICATORS } from "../data/softexIntroFields";
import type {
  DocumentMode,
  DocumentType,
  SoftexContent,
  SoftexIntro,
} from "../types/document";
import { initialsFrom } from "../utils/initials";
import type { ToastType } from "../components/organisms/Toast";

type SoftexFormProps = {
  mode: DocumentMode;
  document: StoredDocument<SoftexContent> | null;
  type: DocumentType;
  onToast: (message: string, type: ToastType) => void;
};

const NAV_START = "start";

export function SoftexForm({ mode, document, type, onToast }: SoftexFormProps) {
  const navigate = useNavigate();
  const {
    content,
    setContent,
    errors,
    status,
    isBusy,
    save,
    sendToReview,
    devolve,
    close,
    reopen,
    archive,
    restore,
  } = useDocumentForm<SoftexContent, SoftexErrors>({
    document,
    type,
    empty: emptySoftexContent,
    emptyErrors: () => ({ required: [] }),
    validate: validateSoftexContent,
    validateReview: validateSoftexContentRequired,
    hasErrors: hasSoftexErrors,
  });
  const actions = useDocumentEditorActions({
    mode,
    save,
    sendToReview,
    devolve,
    close,
    reopen,
    archive,
    restore,
    onToast,
  });

  const [activeMeta, setActiveMeta] = useState<string>(NAV_START);
  const pendingScrollItemRef = useRef<string | null>(null);

  function findItemElement(id: string): HTMLElement | undefined {
    return Array.from(
      globalThis.document.querySelectorAll<HTMLElement>("[data-softex-id]")
    ).find((el) => el.dataset.softexId === id);
  }

  useEffect(() => {
    const target = pendingScrollItemRef.current;
    if (!target) return;
    pendingScrollItemRef.current = null;
    findItemElement(target)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeMeta, content.metas]);

  function handleSelect(target: string) {
    setActiveMeta(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSendToReview() {
    const missing = validateSoftexContentRequired(content).required;
    if (missing.length > 0) {
      const first = missing[0];
      const ownerMeta = content.metas.find(
        (meta) =>
          meta.beforeItems.some((item) => item.id === first) ||
          meta.afterItems.some((item) => item.id === first)
      );
      if (ownerMeta && ownerMeta.id !== activeMeta) {
        pendingScrollItemRef.current = first;
        setActiveMeta(ownerMeta.id);
      } else {
        findItemElement(first)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
    const result = await actions.handleSendToReview();
    if (missing.length > 0) {
      onToast(
        `Preencha todos os ${missing.length} campos obrigatórios antes de enviar.`,
        "error"
      );
    }
    return result;
  }

  function updateAnswer(metaIndex: number, itemId: string, value: string) {
    setContent((prev) => ({
      ...prev,
      metas: prev.metas.map((meta, m) =>
        m === metaIndex
          ? {
              ...meta,
              beforeItems: meta.beforeItems.map((item) =>
                item.id === itemId ? { ...item, answer: value } : item
              ),
              afterItems: meta.afterItems.map((item) =>
                item.id === itemId ? { ...item, answer: value } : item
              ),
            }
          : meta
      ),
    }));
  }

  function updateIntro(field: keyof SoftexIntro, value: string) {
    setContent((prev) => ({
      ...prev,
      intro: { ...prev.intro, [field]: value },
    }));
  }

  const readonly = mode === "view" || mode === "review";
  const doc = document;
  const metas = content.metas;
  const requiredItems = new Set(errors.required);
  const selectedMetaIndex = metas.findIndex((meta) => meta.id === activeMeta);
  const selectedMeta = selectedMetaIndex >= 0 ? metas[selectedMetaIndex] : null;

  const title = mode === "create" ? "Novo documento" : "Softex FM03";
  const subtitle =
    mode === "create" ? "Softex" : `${doc!.number} | ${doc!.trail}`;
  const initials = initialsFrom("Softex FM03");

  return (
    <>
      <DocumentHeader
        mode={mode}
        borderless
        title={title}
        subtitle={subtitle}
        initials={initials}
        status={mode === "create" ? undefined : status}
        disabled={isBusy}
        onSave={mode === "create" || mode === "edit" ? actions.handleSave : undefined}
        onSendToReview={
          mode === "create" || mode === "edit" ? handleSendToReview : undefined
        }
        onDevolve={mode === "review" ? actions.openDevolveDialog : undefined}
        onClose={mode === "review" ? actions.handleClose : undefined}
        onEdit={
          mode === "view" &&
          status !== "Arquivado" &&
          status !== "Concluído"
            ? () => navigate(`/documents/${doc!.id}/edit`)
            : undefined
        }
        onReopen={
          mode === "view" && status === "Concluído" ? actions.handleReopen : undefined
        }
        onArchive={
          mode !== "create" && status !== "Arquivado" && status !== "Concluído"
            ? actions.handleArchive
            : undefined
        }
        onRestore={
          mode === "view" && status === "Arquivado" ? actions.handleRestore : undefined
        }
        onExport={
          mode === "view" && status === "Concluído" ? actions.handleExport : undefined
        }
      />

      {doc?.devolveObservation && mode === "edit" && (
        <div className="mt-8 flex items-start gap-2 rounded-lg border border-blue-100/30 bg-blue-100/5 px-4 py-3">
          <span
            className="material-symbols-outlined shrink-0 text-blue-100"
            style={{ fontSize: 20 }}
          >
            info
          </span>
          <p className="text-sm text-black-80">
            <span className="font-medium text-blue-100">
              Motivo da devolução:
            </span>{" "}
            {doc.devolveObservation}
          </p>
        </div>
      )}

      <MetaNavigation
        items={metas.map((meta) => ({ id: meta.id, label: meta.id }))}
        activeId={activeMeta}
        onSelect={handleSelect}
      />

      <div className="flex w-full flex-col gap-12">
        {selectedMeta ? (
          <section key={selectedMeta.id} className="scroll-mt-52">
            <h2 className="text-2xl font-normal text-blue-100">
              Meta {selectedMeta.id}
            </h2>
            {selectedMeta.metadata.description && (
              <p className="mt-1 text-sm text-black-60">
                {selectedMeta.metadata.description}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-8 pt-2">
              <SoftexPhaseGroup
                title="Antes da Trilha"
                items={selectedMeta.beforeItems}
                onChange={(itemId, value) =>
                  updateAnswer(selectedMetaIndex, itemId, value)
                }
                disabled={readonly}
                requiredItems={requiredItems}
              />
              <SoftexPhaseGroup
                title="Depois da Trilha"
                items={selectedMeta.afterItems}
                onChange={(itemId, value) =>
                  updateAnswer(selectedMetaIndex, itemId, value)
                }
                disabled={readonly}
                requiredItems={requiredItems}
              />
            </div>
          </section>
        ) : (
          <SoftexOverview
            intro={content.intro}
            disabled={readonly}
            onIntroChange={updateIntro}
            indicators={SOFTEX_PROGRESS_INDICATORS}
            onSelectIndicator={handleSelect}
          />
        )}
      </div>

      <ConfirmDialog
        open={actions.devolveOpen}
        title="Devolver para correção"
        message="Descreva opcionalmente o motivo da devolução."
        confirmLabel="Devolver"
        onConfirm={actions.confirmDevolve}
        onCancel={() => actions.setDevolveOpen(false)}
      >
        <Textarea
          id="devolveObservation"
          value={actions.devolveNote}
          onChange={actions.setDevolveNote}
          placeholder="Observações (opcional)"
          maxLength={500}
        />
      </ConfirmDialog>
    </>
  );
}