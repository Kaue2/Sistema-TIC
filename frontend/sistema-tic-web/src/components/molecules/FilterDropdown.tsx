import { useState, useRef, useEffect } from "react";

type FilterOption = {
  label: string;
  value: string;
};

type FilterDropdownProps = {
  selected: string[];
  onChange: (selected: string[]) => void;
  options: FilterOption[];
};

export function FilterDropdown({
  selected,
  onChange,
  options,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleToggle(value: string) {
    if (value === "alfabetica") {
      const already = selected.includes("alfabetica");
      if (already) {
        onChange(selected.filter((s) => s !== "alfabetica"));
      } else {
        onChange([...selected, "alfabetica"]);
      }
      return;
    }

    const already = selected.includes(value);
    let next: string[];
    if (already) {
      next = selected.filter((s) => s !== value);
    } else {
      next = [...selected, value];
    }
    onChange(next);
  }

  const selectedLabel =
    selected.length === 0
      ? "Filtros"
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label || "Filtros"
        : `${selected.length} selecionados`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Filtrar membros"
        className="flex h-10 w-40 items-center gap-2 rounded-lg border border-black-20 bg-card-background px-3 text-sm text-black-60 transition-all duration-200 hover:border-blue-100 focus:border-blue-100 focus:ring-1 focus:ring-blue-100"
      >
        <span
          className="material-symbols-outlined text-black-40"
          style={{ fontSize: 18 }}
        >
          filter_alt
        </span>
        <span className="flex-1 truncate text-left">{selectedLabel}</span>
        <span
          className={`material-symbols-outlined text-black-40 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          style={{ fontSize: 18 }}
        >
          keyboard_arrow_down
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-56 origin-top-left rounded-lg border border-black-20 bg-card-background p-1 shadow-lg"
          style={{
            animation: "fadeScaleIn 150ms ease-out",
          }}
        >
          <style>{`
            @keyframes fadeScaleIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToggle(option.value)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors ${
                  isSelected
                    ? "bg-blue-100/10 text-blue-100"
                    : "text-black-60 hover:bg-black-20/10"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${
                    isSelected ? "text-blue-100" : "text-transparent"
                  }`}
                  style={{
                    fontSize: 16,
                    fontVariationSettings: `'FILL' ${isSelected ? 1 : 0}`,
                  }}
                >
                  check
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
