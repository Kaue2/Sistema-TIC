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
    if (!saved) {
      onToast("Não foi possível salvar o documento.", "error");
      return;
    }
    onToast("Alterações salvas.", "success");
  }

  async function handleSendToReview() {
    const saved = await sendToReview();
    if (!saved) {
      onToast("Não foi possível enviar o documento para revisão.", "error");
      return;
    }
    onToast("Documento enviado para revisão.", "success");
    navigate(`/documents/${saved.id}/review`);
  }

  function openDevolveDialog() {
    setDevolveNote("");
    setDevolveOpen(true);
  }

  async function confirmDevolve() {
    const updated = await devolve(devolveNote.trim() || undefined);
    if (!updated) {
      onToast("Não foi possível devolver o documento.", "error");
      return;
    }
    setDevolveOpen(false);
    onToast("Documento devolvido para correção.", "success");
    navigate(`/documents/${updated.id}/edit`);
  }

  async function handleClose() {
    const updated = await close();
    if (!updated) {
      onToast("Não foi possível concluir o documento.", "error");
      return;
    }
    onToast("Documento concluído.", "success");
    navigate(`/documents/${updated.id}`);
  }

  async function handleReopen() {
    const updated = await reopen();
    if (!updated) {
      onToast("Não foi possível reabrir o documento.", "error");
      return;
    }
    onToast("Documento reaberto.", "success");
    navigate(`/documents/${updated.id}/review`);
  }

  async function handleArchive() {
    const updated = await archive();
    if (!updated) {
      onToast("Não foi possível arquivar o documento.", "error");
      return;
    }
    onToast("Documento arquivado.", "success");
    navigate(`/documents/${updated.id}`);
  }

  async function handleRestore() {
    const updated = await restore();
    if (!updated) {
      onToast("Não foi possível restaurar o documento.", "error");
      return;
    }
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
