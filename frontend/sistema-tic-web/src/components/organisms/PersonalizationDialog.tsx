import { useState } from "react";
import {
  ACCENT_THEMES,
  getAccentTheme,
  setAccentTheme,
  type AccentTheme,
} from "../../services/personalization";

type PersonalizationDialogProps = {
  onClose: () => void;
};

export function PersonalizationDialog({ onClose }: PersonalizationDialogProps) {
  const [selectedTheme, setSelectedTheme] = useState<AccentTheme>(getAccentTheme);

  function handleSave() {
    setAccentTheme(selectedTheme);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="personalization-title"
        className="w-full max-w-md rounded-2xl bg-card-background p-6 shadow-xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="personalization-title" className="text-2xl font-medium text-black-80">
              Personalizar
            </h2>
            <p className="mt-1 text-sm text-black-60">
              Escolha a cor de destaque da interface.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar personalização"
            className="rounded-lg p-1 text-black-60 transition hover:bg-black/5 hover:text-black-80"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(ACCENT_THEMES) as [AccentTheme, (typeof ACCENT_THEMES)[AccentTheme]][]).map(
            ([theme, colors]) => {
              const selected = selectedTheme === theme;

              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setSelectedTheme(theme)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                    selected
                      ? "border-blue-100 bg-blue-100/5"
                      : "border-black/10 hover:border-black/20"
                  }`}
                >
                  <span
                    className="h-8 w-8 rounded-full border border-black/10"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <span className="text-sm font-medium text-black-80">{colors.label}</span>
                </button>
              );
            },
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/20 px-4 py-2 text-sm text-black-80 transition hover:bg-black/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Salvar
          </button>
        </div>
      </section>
    </div>
  );
}
