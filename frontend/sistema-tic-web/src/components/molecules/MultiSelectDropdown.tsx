import { useState, useRef, useEffect } from "react";

export type MultiSelectOption = {
  label: string;
  value: string;
};

type MultiSelectDropdownProps = {
  id?: string;
  label: string;
  icon: string;
  placeholder?: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  size?: "xs" | "sm" | "md";
};

export function MultiSelectDropdown({
  id,
  label,
  icon,
  placeholder,
  options,
  selected,
  onChange,
  multiple = true,
  disabled = false,
  size = "sm",
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
    if (!multiple) {
      onChange([value]);
      setOpen(false);
      return;
    }
    const already = selected.includes(value);
    const next = already
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    onChange(next);
  }

  const selectedValue = multiple ? "" : (selected[0] ?? "");
  const selectedOption = multiple
    ? undefined
    : options.find((opt) => opt.value === selectedValue);
  const buttonText = selectedOption?.label ?? placeholder ?? label;
  const buttonHeight =
    size === "md" ? "h-12" : size === "xs" ? "h-9" : "h-10";

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className={`flex ${buttonHeight} w-full items-center gap-2 rounded-lg border border-black-20 bg-card-background px-3 text-sm transition-all duration-200 focus:border-blue-100 focus:ring-1 focus:ring-blue-100 ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "text-black-60 hover:border-blue-100"
        } ${selectedOption ? "text-black-80" : ""}`}
      >
        <span
          className="material-symbols-outlined text-blue-100"
          style={{ fontSize: 20, fontVariationSettings: `'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20`, }}
        >
          {icon}
        </span>
        <span className="flex-1 truncate text-left">{buttonText}</span>
        {multiple && selected.length > 0 && (
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

      {open && !disabled && (
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
