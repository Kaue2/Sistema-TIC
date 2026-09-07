import { useState } from "react";
import { SoftexItemField } from "./SoftexItemField";
import type { SoftexItem } from "../../types/document";

type SoftexPhaseGroupProps = {
  title: string;
  items: SoftexItem[];
  onChange: (itemId: string, value: string) => void;
  disabled?: boolean;
  requiredItems?: Set<string>;
};

export function SoftexPhaseGroup({
  title,
  items,
  onChange,
  disabled = false,
  requiredItems,
}: SoftexPhaseGroupProps) {
  const [open, setOpen] = useState(true);
  const required = requiredItems ?? new Set<string>();

  if (items.length === 0) return null;

  return (
    <section className="border-b border-blue-40/60 pb-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 text-left transition-colors hover:text-blue-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
      >
        <span className="flex items-center gap-2 text-xl font-normal text-blue-100">
          <span
            className={`material-symbols-outlined transition-transform duration-200 ${
              open ? "" : "-rotate-90"
            }`}
            style={{ fontSize: 22 }}
          >
            expand_more
          </span>
          {title}
        </span>
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-6">
          {items.map((item) => (
            <SoftexItemField
              key={item.id}
              item={item}
              value={item.answer}
              onChange={(value) => onChange(item.id, value)}
              disabled={disabled}
              error={required.has(item.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}