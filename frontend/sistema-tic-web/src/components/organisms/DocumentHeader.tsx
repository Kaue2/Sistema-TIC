import { useNavigate } from "react-router-dom";
import type { DocumentMode, DocumentStatusValue } from "../../types/document";
import { DocumentStatus } from "../atoms/DocumentStatus";
import { Button } from "../atoms/Button";

type DocumentHeaderProps = {
  mode: DocumentMode;
  backTo?: string;
  borderless?: boolean;
  title: string;
  subtitle?: string;
  initials: string;
  updatedAt?: string;
  status?: DocumentStatusValue;
  disabled?: boolean;
  onSave?: () => void;
  onSendToReview?: () => void;
  onDevolve?: () => void;
  onClose?: () => void;
  onEdit?: () => void;
  onReopen?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onExport?: () => void;
};

function formatUpdatedAt(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DocumentHeader({
  mode,
  backTo = "/documents",
  borderless = false,
  title,
  subtitle,
  initials,
  updatedAt,
  status,
  disabled = false,
  onSave,
  onSendToReview,
  onDevolve,
  onClose,
  onEdit,
  onReopen,
  onArchive,
  onRestore,
  onExport,
}: DocumentHeaderProps) {
  const navigate = useNavigate();
  const buttonProps = { disabled };

  return (
    <header
      className={`sticky top-0 z-30 -mx-6 bg-background/95 px-6 pb-4 pt-12 backdrop-blur${
        borderless ? "" : " border-b border-blue-40/60"
      }`}
    >
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="flex items-center gap-1 text-sm text-blue-100 transition-colors hover:text-blue-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          arrow_back
        </span>
        Documentos
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-medium text-white">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-normal text-blue-100">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-sm text-black-60">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-4">
          {updatedAt && (
            <span className="hidden text-xs text-black-60 lg:inline">
              Atualizado em {formatUpdatedAt(updatedAt)}
            </span>
          )}
          {status && <DocumentStatus status={status} />}
          {onSave && (
            <Button
              variant="outline"
              icon="save"
              onClick={onSave}
              {...buttonProps}
            >
              {mode === "create" ? "Salvar rascunho" : "Salvar alterações"}
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" icon="edit" onClick={onEdit} {...buttonProps}>
              Editar
            </Button>
          )}
          {onArchive && (
            <Button variant="outline" icon="archive" onClick={onArchive} {...buttonProps}>
              Arquivar
            </Button>
          )}
          {onRestore && (
            <Button variant="outline" icon="unarchive" onClick={onRestore} {...buttonProps}>
              Restaurar
            </Button>
          )}
          {onDevolve && (
            <Button
              variant="outline"
              icon="undo"
              onClick={onDevolve}
              {...buttonProps}
            >
              Devolver p/ correção
            </Button>
          )}
          {onReopen && (
            <Button variant="green" icon="replay" onClick={onReopen} {...buttonProps}>
              Reabrir
            </Button>
          )}
          {onExport && (
            <Button variant="outline" icon="file_export" onClick={onExport} {...buttonProps}>
              Exportar como
            </Button>
          )}
          {onSendToReview && (
            <Button
              variant="primary"
              icon="send"
              onClick={onSendToReview}
              {...buttonProps}
            >
              Enviar p/ revisão
            </Button>
          )}
          {onClose && (
            <Button
              variant="primary"
              icon="task_alt"
              onClick={onClose}
              {...buttonProps}
            >
              Fechar arquivo
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
