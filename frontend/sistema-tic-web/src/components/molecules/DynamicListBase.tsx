import { useState, type ReactNode } from "react";

type DynamicListBaseProps = {
  title: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  max?: number;
  renderControl: (
    value: string,
    onChange: (value: string) => void,
  ) => ReactNode;
};

export function DynamicListBase({
  title,
  values,
  onChange,
  disabled = false,
  max,
  renderControl,
}: DynamicListBaseProps) {
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  function handleAdd() {
    if (max !== undefined && values.length >= max) return;
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
    if (values.length === 0) {
      onChange([newValue]);
      return;
    }
    onChange(values.map((v, i) => (i === index ? newValue : v)));
  }

  const rows = values.length > 0 ? values : [""];

  return (
    <div>
      <h3 className="text-sm font-medium text-black-80">{title}</h3>

      <div className="mt-1.5 flex flex-col gap-2">
        {rows.map((value, index) => {
          const isLast = index === values.length - 1;
          const isRemoving = removingIndex === index;

          return (
            <div
              key={index}
              className={`flex items-start gap-2 transition-all duration-200 ${
                isRemoving
                  ? "translate-x-2 opacity-0"
                  : "translate-x-0 opacity-100"
              }`}
            >
              <div className="min-w-0 flex-1">
                {renderControl(value, (newValue) => handleChange(index, newValue))}
              </div>

              {isLast &&
                (max !== undefined && values.length >= max ? null : (
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={disabled}
                    aria-label={`Adicionar ${title}`}
                    className={`mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-lg border border-blue-100 text-blue-100 transition-all duration-200 hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 ${
                      disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : ""
                    }`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 20 }}
                    >
                      add_circle
                    </span>
                  </button>
                ))}

              {values.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  aria-label={`Remover ${title}`}
                  className={`mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-lg border border-red-100 text-red-100 transition-all duration-200 hover:bg-red-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-100 ${
                    disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : ""
                  }`}
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
