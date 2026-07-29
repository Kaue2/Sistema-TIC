import { useState } from "react";

type DynamicInputListProps = {
  title: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
};

export function DynamicInputList({
  title,
  placeholder,
  values,
  onChange,
}: DynamicInputListProps) {
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  function handleAdd() {
    onChange([...values, ""]);
  }

  function handleRemove(index: number) {
    if (values.length <= 1) return;
    setRemovingIndex(index);
    setTimeout(() => {
      onChange(values.filter((_, i) => i !== index));
      setRemovingIndex(null);
    }, 200);
  }

  function handleChange(index: number, newValue: string) {
    const updated = values.map((v, i) => (i === index ? newValue : v));
    onChange(updated);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  }

  return (
    <div>
      <h3 className="mb-3 text-lg font-normal text-blue-100">{title}</h3>

      <div className="flex flex-col gap-2">
        {values.map((value, index) => {
          const isLast = index === values.length - 1;
          const isRemoving = removingIndex === index;

          return (
            <div
              key={index}
              className={`flex items-center gap-2 transition-all duration-200 ${
                isRemoving
                  ? "translate-x-2 opacity-0"
                  : "translate-x-0 opacity-100"
              }`}
            >
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-10 flex-1 rounded-lg border border-black-20 bg-card-background px-3 text-sm text-black-80 outline-none transition-all duration-200 placeholder:text-black-40 focus:border-blue-700"
              />

              {isLast && (
                <button
                  type="button"
                  onClick={handleAdd}
                  aria-label={`Adicionar ${title}`}
                  className="flex size-10 items-center justify-center rounded-lg border border-blue-100 text-blue-100 transition-all duration-200 hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20 }}
                  >
                    add_circle
                  </span>
                </button>
              )}

              {values.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={`Remover ${title}`}
                  className="flex size-10 items-center justify-center rounded-lg border border-red-100 text-red-100 transition-all duration-200 hover:bg-red-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-100"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20 }}
                  >
                    remove_circle
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
