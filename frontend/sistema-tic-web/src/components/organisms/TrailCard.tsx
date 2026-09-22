import { useRef, useState } from "react";
import type { Trail } from "../../types/trail";
import { ContextMenu } from "../molecules/ContextMenu";
import type { ContextMenuAnchor } from "../molecules/ContextMenu";

type TrailCardProps = {
  trail: Trail;
  onOpen: (trail: Trail) => void;
  selectionMode: boolean;
  selected: boolean;
  onStartReportSelection: (trail: Trail) => void;
  onToggleSelection: (trail: Trail) => void;
};

function getStageColor(stage: Trail["stage"]): string {
  return stage === "Pré Trilha" ? "bg-yellow-100" : "bg-blue-100";
}

export function TrailCard({
  trail,
  onOpen,
  selectionMode,
  selected,
  onStartReportSelection,
  onToggleSelection,
}: TrailCardProps) {
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<ContextMenuAnchor | null>(null);

  function activateCard() {
    if (selectionMode) onToggleSelection(trail);
    else onOpen(trail);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateCard();
    }
  }

  function openActionsMenu() {
    const rect = moreButtonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuAnchor({ left: rect.right, top: rect.bottom });
  }

  function handleAction(action: string) {
    setMenuAnchor(null);
    if (action === "open") onOpen(trail);
    if (action === "select-report") onStartReportSelection(trail);
  }

  return (
    <>
      <article
        role={selectionMode ? "checkbox" : "link"}
        tabIndex={0}
        aria-checked={selectionMode ? selected : undefined}
        aria-label={
          selectionMode
            ? `${selected ? "Remover" : "Selecionar"} trilha ${trail.title} #${trail.id}`
            : `Abrir trilha ${trail.title} #${trail.id}`
        }
        onClick={activateCard}
        onKeyDown={handleKeyDown}
        className={`relative flex h-40 cursor-pointer items-start gap-4 rounded-2xl border px-6 py-5 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 ${
          selected
            ? "border-blue-100 bg-blue-100/10 shadow-[0_0_0_2px_rgba(24,32,143,0.12)]"
            : "border-blue-100 bg-card-background hover:bg-blue-100/5"
        }`}
      >
        <span
          aria-hidden="true"
          className="material-symbols-outlined mt-1 shrink-0 text-blue-100"
          style={{
            fontSize: 48,
            fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48",
          }}
        >
          {trail.icon}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2 pr-8">
            <h2 className="truncate text-xl font-normal leading-none text-blue-100">
              {trail.title}
            </h2>
            <span className="shrink-0 text-sm text-black-60">#{trail.id}</span>
          </div>
          <p className="mt-2 truncate text-sm leading-none text-black-80">
            {trail.career}
          </p>
          <p className="mt-2 truncate text-sm leading-none text-black-60">
            {trail.mentors[0]?.fullName}
          </p>
        </div>

        <div className="absolute bottom-4 left-6 right-6 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-2 text-black-80">
            <span className={`size-2 rounded-full ${getStageColor(trail.stage)}`} />
            {trail.stage}
          </span>
          <span className="ml-auto text-black-60">{trail.modality}</span>
          <span className="text-blue-100">{trail.semester}</span>
        </div>

        {selectionMode ? (
          <button
            type="button"
            aria-label={selected ? "Remover da seleção" : "Adicionar à seleção"}
            onClick={(event) => {
              event.stopPropagation();
              onToggleSelection(trail);
            }}
            className={`absolute right-3 top-3 flex size-8 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 ${
              selected
                ? "bg-blue-100 text-white"
                : "border border-blue-100 bg-card-background text-blue-100"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 20,
                fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {selected ? "check" : "add"}
            </span>
          </button>
        ) : (
          <button
            ref={moreButtonRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuAnchor !== null}
            aria-label={`Mais ações para ${trail.title}`}
            onClick={(event) => {
              event.stopPropagation();
              openActionsMenu();
            }}
            onKeyDown={(event) => event.stopPropagation()}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-black-40 transition-colors hover:bg-blue-100 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              more_horiz
            </span>
          </button>
        )}
      </article>

      <ContextMenu
        items={[
          { id: "open", label: "Abrir", icon: "open_in_new" },
          { id: "select-report", label: "Selecionar para relatório", icon: "checklist" },
        ]}
        anchor={menuAnchor}
        align="right"
        ariaLabel={`Ações da trilha ${trail.title}`}
        onSelect={handleAction}
        onClose={() => setMenuAnchor(null)}
      />
    </>
  );
}
