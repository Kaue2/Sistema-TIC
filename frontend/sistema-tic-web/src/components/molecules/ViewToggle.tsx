type ViewToggleProps = {
  view: "list" | "cards";
  onChange: (view: "list" | "cards") => void;
};

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-black-20">
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="Visualizar como lista"
        className={`flex items-center gap-1 px-3 py-2 text-sm transition-all duration-200 ${
          view === "list"
            ? "bg-blue-100 text-white"
            : "bg-transparent text-black-60 hover:text-blue-100"
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 18,
            fontVariationSettings: `'FILL' ${view === "list" ? 1 : 0}`,
          }}
        >
          list
        </span>
        Lista
      </button>
      <div className="w-px bg-black-20" />
      <button
        type="button"
        onClick={() => onChange("cards")}
        aria-label="Visualizar como cards"
        className={`flex items-center gap-1 px-3 py-2 text-sm transition-all duration-200 ${
          view === "cards"
            ? "bg-blue-100 text-white"
            : "bg-transparent text-black-60 hover:text-blue-100"
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 18,
            fontVariationSettings: `'FILL' ${view === "cards" ? 1 : 0}`,
          }}
        >
          cards
        </span>
        Cards
      </button>
    </div>
  );
}
