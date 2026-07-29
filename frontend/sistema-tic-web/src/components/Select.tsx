import { useId } from "react";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  id?: string;
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
};

export function Select({
  id: externalId,
  label,
  value,
  options,
  onChange,
  placeholder = " ",
  error = false,
  disabled = false,
}: SelectProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  return (
    <div className="relative">
      <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            peer h-12 w-full rounded border
            ${error ? "border-red-100" : "border-black-20"}
            px-3 pt-2 pb-1
            text-base outline-none transition-all duration-200
            appearance-none bg-card-background
            ${error ? "focus:border-red-100" : "focus:border-blue-700"}
            ${disabled ? "cursor-not-allowed opacity-50 bg-gray-100" : "cursor-pointer"}
          `}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {label && (
          <label
            htmlFor={id}
            className={`
              absolute left-3 px-1
              bg-background
              pointer-events-none
              transition-all duration-200

              ${value || error
                ? "-top-2 translate-y-0 text-xs"
                : "top-1/2 -translate-y-1/2 text-base"
              }
              ${error ? "text-red-100" : "text-black-60"}

              peer-focus:-top-2
              peer-focus:translate-y-0
              peer-focus:text-xs
              ${error ? "peer-focus:text-red-100" : "peer-focus:text-blue-700"}
            `}
          >
            {label}
          </label>
        )}

        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-black-40 pointer-events-none flex items-center"
          style={{ fontSize: 20 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            keyboard_arrow_down
          </span>
        </span>
    </div>
  );
}
