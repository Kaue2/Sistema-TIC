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

  // Falhas da API (ex.: sem permissão, status não permite edição) viram toast com a mensagem do servidor.
  async function attempt<T>(
    operation: () => Promise<T | null>,
    fallbackMessage?: string
  ): Promise<T | null> {
    try {
      const result = await operation();
      if (!result && fallbackMessage) onToast(fallbackMessage, "error");
      return result;
    } catch (error) {
      onToast(
        error instanceof Error ? error.message : (fallbackMessage ?? "Não foi possível concluir a ação."),
        "error"
      );
      return null;
    }
  }

  const [devolveOpen, setDevolveOpen] = useState(false);
  const [devolveNote, setDevolveNote] = useState("");

  async function handleSave() {
    const saved = await attempt(save, "Não foi possível salvar o documento.");
    if (!saved) return;
    onToast("Alterações salvas.", "success");
  }

  async function handleSendToReview() {
    const saved = await attempt(
      sendToReview,
      "Não foi possível enviar o documento para revisão."
    );
    if (!saved) return;
    onToast("Documento enviado para revisão.", "success");
    navigate(`/documents/${saved.id}/review`);
  }

  function openDevolveDialog() {
    setDevolveNote("");
    setDevolveOpen(true);
  }

  async function confirmDevolve() {
    const updated = await attempt(
      () => devolve(devolveNote.trim() || undefined),
      "Não foi possível devolver o documento."
    );
    if (!updated) return;
    setDevolveOpen(false);
    onToast("Documento devolvido para correção.", "success");
    navigate(`/documents/${updated.id}/edit`);
  }

  async function handleClose() {
    const updated = await attempt(close, "Não foi possível concluir o documento.");
    if (!updated) return;
    onToast("Documento concluído.", "success");
    navigate(`/documents/${updated.id}`);
  }

  async function handleReopen() {
    const updated = await attempt(reopen, "Não foi possível reabrir o documento.");
    if (!updated) return;
    onToast("Documento reaberto.", "success");
    navigate(`/documents/${updated.id}/review`);
  }

  async function handleArchive() {
    const updated = await attempt(archive, "Não foi possível arquivar o documento.");
    if (!updated) return;
    onToast("Documento arquivado.", "success");
    navigate(`/documents/${updated.id}`);
  }

  async function handleRestore() {
    const updated = await attempt(restore, "Não foi possível restaurar o documento.");
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
