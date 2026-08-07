import { useState, useRef, useEffect } from "react";

export type MultiSelectOption = {
  label: string;
  value: string;
};

type MultiSelectDropdownProps = {
  label: string;
  icon: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function MultiSelectDropdown({
  label,
  icon,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
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
    const already = selected.includes(value);
    const next = already
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    onChange(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-black-20 bg-card-background px-3 text-sm text-black-60 transition-all duration-200 hover:border-blue-100 focus:border-blue-100 focus:ring-1 focus:ring-blue-100"
      >
        <span
          className="material-symbols-outlined text-blue-100"
          style={{ fontSize: 20, fontVariationSettings: `'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20`, }}
        >
          {icon}
        </span>
        <span className="flex-1 truncate text-left">{label}</span>
        {selected.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1 text-xs text-white">
            {selected.length}
          </span>
        )}
        <span
          className={`material-symbols-outlined text-black-40 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          style={{ fontSize: 18 }}
        >
          keyboard_arrow_down
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute left-0 top-full z-50 mt-1 w-full origin-top-left rounded-lg border border-black-20 bg-card-background p-1 shadow-lg animate-fade-scale-in"
        >
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleToggle(option.value)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors ${
                  isSelected
                    ? "bg-blue-100/10 text-blue-100"
                    : "text-black-60 hover:bg-black-20/10"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors duration-150 ${
                    isSelected
                      ? "border-blue-100 bg-blue-100 text-white"
                      : "border-black-40 bg-card-background"
                  }`}
                >
                  {isSelected && (
                    <span
                      className="material-symbols-outlined leading-none"
                      style={{
                        fontSize: 12,
                        fontVariationSettings: "'FILL' 1",
                      }}
                    >
                      check
                    </span>
                  )}
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
