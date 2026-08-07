import { useEffect, useRef } from "react";

export type ContextMenuItem = {
  id: string;
  label: string;
  icon: string;
  danger?: boolean;
};

export type ContextMenuAnchor = {
  left: number;
  top: number;
};

type ContextMenuProps = {
  items: ContextMenuItem[];
  anchor: ContextMenuAnchor | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  align?: "left" | "right";
};

export function ContextMenu({
  items,
  anchor,
  onSelect,
  onClose,
  align = "left",
}: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchor) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [anchor, onClose]);

  if (!anchor) return null;

  const menuWidth = 192;
  const rawLeft = align === "right" ? anchor.left - menuWidth : anchor.left;
  const left = Math.min(rawLeft, window.innerWidth - menuWidth - 8);
  const top = anchor.top + 4;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Ações do documento"
      className="fixed z-50 origin-top-right rounded-lg border border-black-20 bg-card-background p-1 shadow-lg animate-fade-scale-in"
      style={{ left, top, width: menuWidth }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          onClick={() => onSelect(item.id)}
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 ${
            item.danger
              ? "text-red-100 hover:bg-red-100/10"
              : "text-black-60 hover:bg-blue-100/10 hover:text-blue-100"
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
          >
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
