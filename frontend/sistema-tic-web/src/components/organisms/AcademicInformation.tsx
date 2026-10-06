import { useState } from "react";

type AcademicInformationProps = {
  curriculumUrl?: string;
  lattesUrl?: string;
  editingAllowed?: boolean;
  onSave?: (curriculumUrl: string, lattesUrl: string) => Promise<boolean>;
  onToast?: (message: string, type: "success" | "error") => void;
};

type EditableLinkKey = "curriculum" | "lattes";

const LINK_LABELS: Record<EditableLinkKey, string> = {
  curriculum: "Mini Currículo",
  lattes: "Perfil Lattes",
};

function Icon({
  name,
  size = 18,
  weight = 300,
}: {
  name: string;
  size?: number;
  weight?: number;
}) {
  return (
    <span
      className="material-symbols-outlined flex items-center justify-center self-center"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' 0, 'wght' ${weight}, 'GRAD' 0, 'opsz' 18`,
      }}
    >
      {name}
    </span>
  );
}

export function AcademicInformation({
  curriculumUrl,
  lattesUrl,
  editingAllowed = false,
  onSave,
  onToast,
}: AcademicInformationProps) {
  const [editing, setEditing] = useState<EditableLinkKey | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const urls: Record<EditableLinkKey, string> = {
    curriculum: curriculumUrl ?? "",
    lattes: lattesUrl ?? "",
  };

  function startEditing(key: EditableLinkKey) {
    setDraft(urls[key]);
    setEditing(key);
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      onToast?.("Link copiado.", "success");
    } catch {
      onToast?.("Não foi possível copiar o link.", "error");
    }
  }

  async function handleSave(key: EditableLinkKey) {
    if (!onSave) return;

    setSaving(true);
    const ok = await onSave(
      key === "curriculum" ? draft.trim() : curriculumUrl ?? "",
      key === "lattes" ? draft.trim() : lattesUrl ?? "",
    );
    setSaving(false);

    if (ok) setEditing(null);
  }

  function renderLink(key: EditableLinkKey) {
    const label = LINK_LABELS[key];
    const url = urls[key];

    if (editing === key) {
      return (
        <div
          key={key}
          className="flex h-9 items-center gap-2 rounded-lg border border-blue-100 px-3 focus-within:ring-1 focus-within:ring-blue-100"
        >
          <input
            autoFocus
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={saving}
            aria-label={`URL do ${label}`}
            placeholder="https://exemplo.com/..."
            className="min-w-0 flex-1 bg-transparent text-sm text-black-80 outline-none"
          />

          <button
            type="button"
            aria-label={`Salvar ${label}`}
            onClick={() => handleSave(key)}
            disabled={saving}
            className="flex items-center text-blue-100 transition hover:opacity-70 disabled:opacity-50"
          >
            <Icon name="check" size={20} weight={500} />
          </button>

          <button
            type="button"
            aria-label="Cancelar edição"
            onClick={() => setEditing(null)}
            disabled={saving}
            className="flex items-center text-black-60 transition hover:text-black-80 disabled:opacity-50"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      );
    }

    if (!url) {
      return (
        <div
          key={key}
          className="flex h-9 items-center gap-2 rounded-lg border border-black-20 px-3 text-sm text-black-60"
        >
          <Icon name="add_link" />
          <span className="flex items-center">{label}</span>
          <span className="border-l border-black-20" />
          <span className="text-sm text-black-60">Não informado</span>

          {editingAllowed && (
            <button
              type="button"
              aria-label={`Editar ${label}`}
              onClick={() => startEditing(key)}
              className="ml-1 flex items-center text-blue-100 transition hover:opacity-70"
            >
              <Icon name="edit_square" size={18} />
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        key={key}
        className="flex h-9 items-stretch overflow-hidden rounded-lg border border-blue-100 text-sm text-blue-100"
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center gap-2 self-stretch rounded-l-lg px-3 transition-colors hover:bg-blue-100/10"
        >
          <Icon name="add_link" />
          <span className="flex items-center">{label}</span>
        </a>

        <span className="border-l border-blue-100" />

        <button
          type="button"
          aria-label={`Copiar link do ${label}`}
          onClick={() => handleCopy(url)}
          className="flex items-center px-2 text-blue-100 transition hover:opacity-70"
        >
          <Icon name="content_copy" size={18} />
        </button>

        {editingAllowed && (
          <button
            type="button"
            aria-label={`Editar ${label}`}
            onClick={() => startEditing(key)}
            className="flex items-center px-2 text-blue-100 transition hover:opacity-70"
          >
            <Icon name="edit_square" size={18} />
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-medium text-black-80">
        Informações Acadêmicas
      </h2>

      <div className="flex flex-wrap gap-3">
        {(["curriculum", "lattes"] as EditableLinkKey[]).map(renderLink)}
      </div>
    </section>
  );
}