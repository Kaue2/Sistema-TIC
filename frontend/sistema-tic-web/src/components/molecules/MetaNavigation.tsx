type MetaNavigationProps = {
  items: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
};

const TAB_BASE =
  "flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100";
const TAB_INACTIVE =
  "border-blue-100 text-blue-100 hover:bg-blue-100/10 active:bg-blue-100/10";
const TAB_ACTIVE = "border-blue-100 bg-blue-100 text-white";

export function MetaNavigation({ items, activeId, onSelect }: MetaNavigationProps) {
  return (
    <nav className="sticky top-32 z-20 -mx-6 bg-background/95 px-6 py-2 backdrop-blur">
      <div className="flex overflow-x-auto">
        <div className="m-auto flex gap-2 pb-1">
          <button
            type="button"
            onClick={() => onSelect("start")}
            aria-current={activeId === "start" ? "true" : undefined}
            className={`${TAB_BASE} ${activeId === "start" ? TAB_ACTIVE : TAB_INACTIVE}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              star
            </span>
            Início
          </button>

          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={activeId === item.id ? "true" : undefined}
              className={`${TAB_BASE} ${activeId === item.id ? TAB_ACTIVE : TAB_INACTIVE}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}