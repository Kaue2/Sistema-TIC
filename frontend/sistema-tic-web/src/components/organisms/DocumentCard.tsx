import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Document } from "../../types/document";
import { DOCUMENT_TYPE_ICONS } from "../../types/document";
import { DocumentStatus } from "../atoms/DocumentStatus";
import { ContextMenu } from "../molecules/ContextMenu";
import type { ContextMenuItem, ContextMenuAnchor } from "../molecules/ContextMenu";

type DocumentCardProps = {
  document: Document;
  onEdit?: (document: Document) => void;
  onDuplicate?: (document: Document) => void;
  onArchive?: (document: Document) => void;
};

const CONTEXT_MENU_ITEMS: ContextMenuItem[] = [
  { id: "open", label: "Abrir", icon: "open_in_new" },
  { id: "edit", label: "Editar", icon: "edit" },
  { id: "duplicate", label: "Duplicar", icon: "content_copy" },
  { id: "archive", label: "Arquivar", icon: "archive", danger: true },
];

export function DocumentCard({
  document,
  onEdit,
  onDuplicate,
  onArchive,
}: DocumentCardProps) {
  const navigate = useNavigate();
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<ContextMenuAnchor | null>(null);

  function handleOpen() {
    navigate(`/documents/${document.id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpen();
    }
  }

  function handleMoreClick() {
    const rect = moreButtonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuAnchor({ left: rect.left, top: rect.bottom });
  }

  function handleMenuSelect(id: string) {
    setMenuAnchor(null);
    switch (id) {
      case "open":
        handleOpen();
        break;
      case "edit":
        onEdit?.(document);
        break;
      case "duplicate":
        onDuplicate?.(document);
        break;
      case "archive":
        onArchive?.(document);
        break;
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Abrir documento ${document.title} ${document.number}`}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        className="relative flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-blue-40 bg-card-background px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-100/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
      >
        <span
          aria-hidden="true"
          className="material-symbols-outlined shrink-0 text-blue-100"
          style={{ fontSize: 48, fontVariationSettings: `'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48`, }}
        >
          {DOCUMENT_TYPE_ICONS[document.type]}
        </span>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div className="flex min-w-0 items-baseline gap-2">
            <h3 className="truncate text-xl font-normal text-blue-100">
              {document.title}
            </h3>
            <span className="shrink-0 text-sm text-black-60">
              {document.number}
            </span>
          </div>
          <p className="truncate text-sm text-black-80">{document.trail}</p>
          <p className="truncate text-sm text-black-60">{document.career}</p>
          <div className="mt-1 flex items-center gap-2">
            <DocumentStatus status={document.status} />
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-sm text-black-60">
              <span className="shrink-0">{document.teachingMode}</span>
            </div>
            <span className="shrink-0 text-sm text-blue-100">
              {document.semester}
            </span>
          </div>
        </div>

        <button
          ref={moreButtonRef}
          type="button"
          aria-label="Mais ações"
          onClick={(e) => {
            e.stopPropagation();
            handleMoreClick();
          }}
          onKeyDown={(e) => e.stopPropagation()}
          className="absolute right-2 top-4 flex size-8 shrink-0 items-center justify-center rounded-full text-black-40 transition-colors duration-200 hover:bg-blue-100 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            more_horiz
          </span>
        </button>
      </div>

      <ContextMenu
        items={CONTEXT_MENU_ITEMS}
        anchor={menuAnchor}
        onSelect={handleMenuSelect}
        onClose={() => setMenuAnchor(null)}
      />
    </>
  );
}
