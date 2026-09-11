import { useEffect, useState } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { FormField } from "./FormField";
import { MultiSelectDropdown } from "./MultiSelectDropdown";
import {
  createTrack,
  createTrackTeamMember,
  getKnowledgeAreas,
  type KnowledgeAreaDTO,
  type TrackResponseDTO,
} from "../../services/track-services";
import { getMembers, type MemberSummaryDTO } from "../../services/user-services";

const MODALITY_OPTIONS = [
  { label: "Online", value: "online" },
  { label: "Híbrido", value: "hybrid" },
];

const LEARNING_LEVEL_OPTIONS = [
  { label: "Introdutório", value: "introductory" },
  { label: "Intermediário", value: "intermediate" },
  { label: "Avançado", value: "advanced" },
];

// Monitoria ainda não tem de onde vir (falta decidir o mesmo filtro por role pra monitor)
// e não é enviada na criação da trilha; fica só visual até essa parte ser resolvida.
const PENDING_OPTIONS: { label: string; value: string }[] = [];

type CreateTrackModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (track: TrackResponseDTO) => void;
};

export function CreateTrackModal({ open, onClose, onCreated }: CreateTrackModalProps) {
  const [knowledgeAreas, setKnowledgeAreas] = useState<KnowledgeAreaDTO[]>([]);
  const [mentors, setMentors] = useState<MemberSummaryDTO[]>([]);
  const [title, setTitle] = useState("");
  const [knowledgeAreaId, setKnowledgeAreaId] = useState("");
  const [modality, setModality] = useState("online");
  const [learningLevel, setLearningLevel] = useState("");
  const [workloadMinutes, setWorkloadMinutes] = useState("60");
  const [inPersonWorkloadMinutes, setInPersonWorkloadMinutes] = useState("60");
  const [mentorUserId, setMentorUserId] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [knowledgeAreaError, setKnowledgeAreaError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setTitle("");
    setKnowledgeAreaId("");
    setModality("online");
    setLearningLevel("");
    setWorkloadMinutes("60");
    setInPersonWorkloadMinutes("60");
    setMentorUserId("");
    setTitleError(false);
    setKnowledgeAreaError(false);
    setError(null);

    getKnowledgeAreas()
      .then(setKnowledgeAreas)
      .catch(() => setError("Não foi possível carregar as áreas de conhecimento."));

    getMembers()
      .then((members) => setMentors(members.filter((member) => member.roleCode === "mentor")))
      .catch(() => setError("Não foi possível carregar os mentores."));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSave() {
    let hasError = false;

    if (!title.trim()) {
      setTitleError(true);
      hasError = true;
    }
    if (!knowledgeAreaId) {
      setKnowledgeAreaError(true);
      hasError = true;
    }
    if (hasError) return;

    const onlineMinutes = Number(workloadMinutes) || 0;
    const inPersonMinutes = modality === "hybrid" ? Number(inPersonWorkloadMinutes) || 0 : 0;

    setSubmitting(true);
    setError(null);

    try {
      const created = await createTrack({
        sourceTrackId: null,
        knowledgeAreaId,
        categoryId: null,
        title,
        shortDescription: null,
        modality,
        learningLevel: learningLevel || null,
        plannedProductionStartsOn: null,
        plannedProductionEndsOn: null,
        plannedTrackStartsOn: null,
        plannedTrackEndsOn: null,
        registrationStartsAt: null,
        registrationEndsAt: null,
        onlineWorkloadMinutes: onlineMinutes,
        inPersonWorkloadMinutes: inPersonMinutes,
        plannedCapacity: null,
        targetAudience: null,
        prerequisites: null,
        attendanceRequirementPercent: null,
      });

      // só é sucesso se o back de fato devolveu a trilha criada (com id); qualquer outra
      // resposta cai no mesmo tratamento de erro do catch.
      if (!created?.id) {
        throw new Error("Resposta da criação da trilha não trouxe um id.");
      }

      if (mentorUserId) {
        await createTrackTeamMember({
          trackId: created.id,
          userId: mentorUserId,
          responsibility: "mentor",
          isLead: false,
          startsOn: null,
        });
      }

      onCreated(created);
    } catch {
      setError("Erro ao criar a trilha.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nova Trilha"
        className="flex max-h-[85dvh] w-full max-w-4xl flex-col rounded-2xl bg-card-background shadow-lg outline-none"
      >
        <header className="flex items-center justify-between gap-4 p-6 pb-4">
          <h3 className="text-[52px] text-blue-100 font-normal">Nova Trilha</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1 text-black-40 transition-colors hover:text-black-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, fontVariationSettings: "'wght' 300" }}
            >
              close
            </span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
          <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1">
          <section>
            <h4 className="text-lg font-normal text-blue-100">Informações Base</h4>
            <div className="mt-4 flex flex-col gap-5">
              <FormField
                id="track-title"
                label="Nome da Trilha"
                error={titleError ? "Nome da trilha é obrigatório." : undefined}
              >
                <Input
                  id="track-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setTitleError(false);
                  }}
                  error={titleError}
                  placeholder="Ex: Algoritmos em C"
                />
              </FormField>

              <FormField
                id="track-knowledge-area"
                label="Área de Conhecimento"
                error={knowledgeAreaError ? "Selecione uma área de conhecimento." : undefined}
              >
                <MultiSelectDropdown
                  id="track-knowledge-area"
                  label="Área de Conhecimento"
                  icon="school"
                  placeholder="Selecione uma área"
                  multiple={false}
                  options={knowledgeAreas.map((area) => ({ label: area.name, value: area.id }))}
                  selected={knowledgeAreaId ? [knowledgeAreaId] : []}
                  onChange={(selected) => {
                    setKnowledgeAreaId(selected[0] ?? "");
                    setKnowledgeAreaError(false);
                  }}
                  size="md"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <FormField id="track-modality" label="Regime">
                  <MultiSelectDropdown
                    id="track-modality"
                    label="Regime"
                    icon="cast_for_education"
                    multiple={false}
                    options={MODALITY_OPTIONS}
                    selected={[modality]}
                    onChange={(selected) => setModality(selected[0] ?? "online")}
                    size="md"
                  />
                </FormField>

                <FormField id="track-learning-level" label="Nível">
                  <MultiSelectDropdown
                    id="track-learning-level"
                    label="Nível"
                    icon="school"
                    placeholder="Selecione um nível"
                    multiple={false}
                    options={LEARNING_LEVEL_OPTIONS}
                    selected={learningLevel ? [learningLevel] : []}
                    onChange={(selected) => setLearningLevel(selected[0] ?? "")}
                    size="md"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <Input
                  id="track-online-workload"
                  label="Carga Horária Online (min)"
                  type="number"
                  value={workloadMinutes}
                  onChange={(e) => setWorkloadMinutes(e.target.value)}
                />

                {modality === "hybrid" && (
                  <Input
                    id="track-in-person-workload"
                    label="Carga Horária Presencial (min)"
                    type="number"
                    value={inPersonWorkloadMinutes}
                    onChange={(e) => setInPersonWorkloadMinutes(e.target.value)}
                  />
                )}
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-lg font-normal text-blue-100">Acessos e Vínculos</h4>
            <div className="mt-4 flex flex-col gap-5">
              <FormField id="track-mentor" label="Mentoria">
                <MultiSelectDropdown
                  id="track-mentor"
                  label="Mentoria"
                  icon="person"
                  placeholder="Selecione um mentor"
                  multiple={false}
                  options={mentors.map((mentor) => ({ label: mentor.fullName, value: mentor.id }))}
                  selected={mentorUserId ? [mentorUserId] : []}
                  onChange={(selected) => setMentorUserId(selected[0] ?? "")}
                  size="md"
                />
              </FormField>

              <FormField id="track-monitor" label="Monitoria">
                <MultiSelectDropdown
                  id="track-monitor"
                  label="Monitoria"
                  icon="person"
                  placeholder="Em breve"
                  multiple={false}
                  disabled
                  options={PENDING_OPTIONS}
                  selected={[]}
                  onChange={() => {}}
                  size="md"
                />
              </FormField>
            </div>
          </section>
          </div>

          {error && <p className="mt-4 text-sm text-red-100">{error}</p>}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-black-20 p-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="green" icon="save" onClick={handleSave} disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
