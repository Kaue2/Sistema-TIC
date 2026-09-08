import { useState } from "react";
import { mockTrails } from "../../data/mockTrails";
import type { Trail } from "../../types/trail";
import { TrailSelectorModal } from "./TrailSelectorModal";

type TrailSelectFieldProps = {
  title: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  trails?: Trail[];
};

export function TrailSelectField({
  title,
  values,
  onChange,
  disabled = false,
  trails = mockTrails,
}: TrailSelectFieldProps) {
  const [open, setOpen] = useState(false);

  const selectedItems = values.map((value) => {
    const trail =
      trails.find((t) => t.id === value) ?? trails.find((t) => t.title === value);
    return {
      key: value,
      label: trail ? trail.title : value,
      semester: trail?.semester,
    };
  });

  function handleRemove(key: string) {
    onChange(values.filter((value) => value !== key));
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-black-80">{title}</h3>

      <div className="mt-1.5 rounded-lg border border-black-20 bg-card-background p-3">
        {selectedItems.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <span
                key={item.key}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/10 py-1.5 pl-3 pr-2 text-sm text-blue-100"
              >
                <span className="max-w-52 truncate">{item.label}</span>
                {item.semester && (
                  <>
                    <span aria-hidden="true" className="text-blue-100/50">
                      ·
                    </span>
                    <span className="text-xs text-blue-100/70">
                      {item.semester}
                    </span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(item.key)}
                  disabled={disabled}
                  aria-label={`Remover ${item.label}`}
                  className="text-blue-100 transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, fontVariationSettings: "'wght' 300" }}
                  >
                    close
                  </span>
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-black-40">Nenhuma trilha selecionada</p>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="mt-3 flex h-9 items-center gap-1.5 rounded-lg border border-blue-100 px-3 text-sm text-blue-100 transition-colors hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, fontVariationSettings: "'wght' 300" }}
          >
            add
          </span>
          Selecionar trilhas
        </button>
      </div>

      <TrailSelectorModal
        open={open}
        trails={trails}
        selectedTrailIds={values}
        onConfirm={(selected) => {
          onChange(selected);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}