import { useId } from "react";
import { CharacterCounter } from "./CharacterCounter";

type TextareaProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  hint?: string;
  disabled?: boolean;
  rows?: number;
};

export function Textarea({
  id: externalId,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
  disabled = false,
  rows = 4,
}: TextareaProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        rows={rows}
        className={`w-full resize-y rounded-lg border border-black-20 bg-card-background px-3 py-2.5 text-sm text-black-80 outline-none transition-all duration-200 placeholder:text-black-40 focus:border-blue-100 focus:ring-1 focus:ring-blue-100 hover:border-blue-100 ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "placeholder:text-black-40"
        }`}
      />
      {maxLength !== undefined || hint ? (
        <div className="mt-1 flex items-start justify-between gap-4 text-xs">
          {hint && <p className="text-black-60">{hint}</p>}
          {maxLength !== undefined && (
            <span className={hint ? "shrink-0" : "ml-auto"}>
              <CharacterCounter length={value.length} max={maxLength} />
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
