import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ToastType } from "../components/organisms/Toast";
import type { DocumentMode } from "../types/document";
import type { StoredDocument } from "../services/document/DocumentService";

type UseDocumentEditorActionsOptions<C extends object> = {
  mode: DocumentMode;
  save: () => Promise<StoredDocument<C> | null>;
  sendToReview: () => Promise<StoredDocument<C> | null>;
  devolve: (observation?: string) => Promise<StoredDocument<C> | null>;
  close: () => Promise<StoredDocument<C> | null>;
  reopen: () => Promise<StoredDocument<C> | null>;
  archive: () => Promise<StoredDocument<C> | null>;
  restore: () => Promise<StoredDocument<C> | null>;
  onToast: (message: string, type: ToastType) => void;
};

export function useDocumentEditorActions<C extends object>({
  mode,
  save,
  sendToReview,
  devolve,
  close,
  reopen,
  archive,
  restore,
  onToast,
}: UseDocumentEditorActionsOptions<C>) {
  const navigate = useNavigate();
  const [devolveOpen, setDevolveOpen] = useState(false);
  const [devolveNote, setDevolveNote] = useState("");

  async function handleSave() {
    const saved = await save();
    if (!saved) return;
    if (mode === "create") {
      onToast("Rascunho salvo.", "success");
      navigate(`/documents/${saved.id}/edit`);
    } else {
      onToast("Alterações salvas.", "success");
    }
  }

  async function handleSendToReview() {
    const saved = await sendToReview();
    if (!saved) return;
    onToast("Documento enviado para revisão.", "success");
    navigate(`/documents/${saved.id}/review`);
  }

  function openDevolveDialog() {
    setDevolveNote("");
    setDevolveOpen(true);
  }

  async function confirmDevolve() {
    const updated = await devolve(devolveNote.trim() || undefined);
    if (!updated) return;
    setDevolveOpen(false);
    onToast("Documento devolvido para correção.", "success");
    navigate(`/documents/${updated.id}/edit`);
  }

  async function handleClose() {
    const updated = await close();
    if (!updated) return;
    onToast("Documento concluído.", "success");
    navigate(`/documents/${updated.id}`);
  }

  async function handleReopen() {
    const updated = await reopen();
    if (!updated) return;
    onToast("Documento reaberto.", "success");
    navigate(`/documents/${updated.id}/review`);
  }

  async function handleArchive() {
    const updated = await archive();
    if (!updated) return;
    onToast("Documento arquivado.", "success");
    navigate(`/documents/${updated.id}`);
  }

  async function handleRestore() {
    const updated = await restore();
    if (!updated) return;
    onToast("Documento restaurado para rascunho.", "success");
  }

  function handleExport() {
    onToast("Exportação em breve.", "info");
  }

  return {
    devolveOpen,
    setDevolveOpen,
    devolveNote,
    setDevolveNote,
    openDevolveDialog,
    handleSave,
    handleSendToReview,
    confirmDevolve,
    handleClose,
    handleReopen,
    handleArchive,
    handleRestore,
    handleExport,
  };
}
