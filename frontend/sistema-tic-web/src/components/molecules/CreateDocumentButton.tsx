import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContextMenu } from "./ContextMenu";
import type { ContextMenuAnchor, ContextMenuItem } from "./ContextMenu";

const CREATE_ITEMS: ContextMenuItem[] = [
  { id: "Escopo e Proposta", label: "Escopo e Proposta", icon: "assignment" },
  { id: "Plano de Ensino", label: "Plano de Ensino", icon: "school" },
  { id: "Softex", label: "Softex", icon: "business_center" },
];

export function CreateDocumentButton() {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<ContextMenuAnchor | null>(null);

  function handleClick() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAnchor({ left: rect.right, top: rect.bottom });
  }

  function handleSelect(id: string) {
    setAnchor(null);
    navigate(`/documents/new?type=${encodeURIComponent(id)}`);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Criar novo documento"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={handleClick}
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-blue-100 px-4 text-sm text-white transition-all duration-200 hover:bg-blue-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          add
        </span>
        Novo
        <span
          className={`material-symbols-outlined transition-transform duration-150 ${anchor ? "rotate-180" : ""}`}
          style={{ fontSize: 18 }}
        >
          keyboard_arrow_down
        </span>
      </button>

      <ContextMenu
        items={CREATE_ITEMS}
        anchor={anchor}
        align="right"
        onSelect={handleSelect}
        onClose={() => setAnchor(null)}
      />
    </>
  );
}
