import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { DocumentHeader } from "../components/organisms/DocumentHeader";
import { Toast, type ToastType } from "../components/organisms/Toast";
import { FormSection } from "../components/molecules/FormSection";
import { FormField } from "../components/molecules/FormField";
import { CheckboxGroup } from "../components/molecules/CheckboxGroup";
import { CheckboxList } from "../components/molecules/CheckboxList";
import { DynamicInputList } from "../components/molecules/DynamicInputList";
import { MultiSelectDropdown } from "../components/molecules/MultiSelectDropdown";
import { ConfirmDialog } from "../components/molecules/ConfirmDialog";
import { Input } from "../components/atoms/Input";
import { Textarea } from "../components/atoms/Textarea";
import { Button } from "../components/atoms/Button";
import { useDocumentForm } from "../hooks/useDocumentForm";
import {
  DocumentService,
  type StoredDocument,
} from "../services/document/DocumentService";
import type { DocumentContent, DocumentMode, DocumentType } from "../types/document";
import {
  CAREER_FIELD_OPTIONS,
  GREAT_AREA_OPTIONS,
  MODALITY_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
  WORKLOAD_OPTIONS,
  LEVEL_OPTIONS,
  NON_TECHNICAL_COMPETENCY_OPTIONS,
  CURRICULUM_NATURE_OPTIONS,
} from "../data/documentFields";

const VALID_TYPES: DocumentType[] = [
  "Escopo e Proposta",
  "Plano de Ensino",
  "Softex",
];

const NAV_ITEMS = [
  { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
  { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
  { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: true },
  { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
  { id: "profile", label: "", icon: "account_circle", route: "/profile", enabled: true, visible: true, notification: false, active: false, avatar: true },
];

export function DocumentEditorPage({ mode }: { mode: DocumentMode }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type");
  const type: DocumentType =
    typeParam && VALID_TYPES.includes(typeParam as DocumentType)
      ? (typeParam as DocumentType)
      : "Escopo e Proposta";

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  return (
    <div className="relative min-h-screen bg-background">
      <FixedNavigation position="left" items={NAV_ITEMS} />

      <main className="relative mx-auto flex min-h-screen w-full max-w-300 flex-col px-6 pb-16">
        <DocumentEditor
          key={mode === "create" ? `create:${type}` : id}
          mode={mode}
          type={type}
          onToast={(message, toastType) => setToast({ message, type: toastType })}
        />
      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

type DocumentEditorProps = {
  mode: DocumentMode;
  type: DocumentType;
  onToast: (message: string, type: ToastType) => void;
};

function DocumentEditor({ mode, type, onToast }: DocumentEditorProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (mode === "create") return;
    let cancelled = false;
    DocumentService.getDocument(id!).then((doc) => {
      if (cancelled) return;
      setDocument(doc);
      setNotFound(doc === null);
    });
    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  if (mode === "create") {
    return (
      <DocumentEditorForm
        mode={mode}
        document={null}
        type={type}
        onToast={onToast}
      />
    );
  }

  if (notFound) {
    return (
      <div className="mt-40 flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-black-40" style={{ fontSize: 56 }}>
          description
        </span>
        <p className="text-xl text-black-80">Documento não encontrado.</p>
        <Button variant="outline" icon="arrow_back" onClick={() => navigate("/documents")}>
          Voltar para documentos
        </Button>
      </div>
    );
  }

  if (document === null) {
    return <EditorSkeleton />;
  }

  return (
    <DocumentEditorForm
      mode={mode}
      document={document}
      type={type}
      onToast={onToast}
    />
  );
}

type DocumentEditorFormProps = {
  mode: DocumentMode;
  document: StoredDocument | null;
  type: DocumentType;
  onToast: (message: string, type: ToastType) => void;
};

function DocumentEditorForm({
  mode,
  document,
  type,
  onToast,
}: DocumentEditorFormProps) {
  const navigate = useNavigate();
  const { content, setContent, errors, status, isBusy, save, sendToReview, devolve, close, reopen, archive, restore } =
    useDocumentForm({ document, type });
  const [devolveOpen, setDevolveOpen] = useState(false);
  const [devolveNote, setDevolveNote] = useState("");

  const readonly = mode === "view" || mode === "review";
  const doc = document;

  function update(field: keyof DocumentContent, value: DocumentContent[keyof DocumentContent]) {
    setContent((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    const saved = await save();
    if (!saved) return;
    if (mode === "create") {
      onToast("Rascunho salvo.", "success");
      navigate(`/documents/${saved.id}/edit`);
    } else {
      onToast("Alterações salvas.", "success");
    }
  }

  async function handleSendToReview() {
    const saved = await sendToReview();
    if (!saved) return;
    onToast("Documento enviado para revisão.", "success");
    navigate(`/documents/${saved.id}/review`);
  }

  function openDevolveDialog() {
    setDevolveNote("");
    setDevolveOpen(true);
  }

  async function confirmDevolve() {
    const updated = await devolve(devolveNote.trim() || undefined);
    if (!updated) return;
    setDevolveOpen(false);
    onToast("Documento devolvido para correção.", "success");
    navigate(`/documents/${updated.id}/edit`);
  }

  async function handleClose() {
    const updated = await close();
    if (!updated) return;
    onToast("Documento concluído.", "success");
    navigate(`/documents/${updated.id}`);
  }

  async function handleReopen() {
    const updated = await reopen();
    if (!updated) return;
    onToast("Documento reaberto.", "success");
    navigate(`/documents/${updated.id}/review`);
  }

  async function handleArchive() {
    const updated = await archive();
    if (!updated) return;
    onToast("Documento arquivado.", "success");
    navigate(`/documents/${updated.id}`);
  }

  async function handleRestore() {
    const updated = await restore();
    if (!updated) return;
    onToast("Documento restaurado para rascunho.", "success");
  }

  function handleExport() {
    onToast("Exportação em breve.", "info");
  }

  const title = mode === "create" ? "Novo documento" : doc!.title;
  const subtitle =
    mode === "create" ? type : `${doc!.type} · ${doc!.number}`;
  const teacherName = content.teacherName.trim();
  const initials = initialsFrom(teacherName || title);

  return (
    <>
      <DocumentHeader
        mode={mode}
        title={title}
        subtitle={subtitle}
        initials={initials}
        status={mode === "create" ? undefined : status}
        disabled={isBusy}
        onSave={mode === "create" || mode === "edit" ? handleSave : undefined}
        onSendToReview={
          mode === "create" || mode === "edit" ? handleSendToReview : undefined
        }
        onDevolve={mode === "review" ? openDevolveDialog : undefined}
        onClose={mode === "review" ? handleClose : undefined}
        onEdit={
          mode === "view" &&
          status !== "Arquivado" &&
          status !== "Concluído"
            ? () => navigate(`/documents/${doc!.id}/edit`)
            : undefined
        }
        onReopen={
          mode === "view" && status === "Concluído" ? handleReopen : undefined
        }
        onArchive={
          mode !== "create" && status !== "Arquivado" && status !== "Concluído"
            ? handleArchive
            : undefined
        }
        onRestore={
          mode === "view" && status === "Arquivado" ? handleRestore : undefined
        }
        onExport={
          mode === "view" && status === "Concluído" ? handleExport : undefined
        }
      />

      {doc?.devolveObservation && mode === "edit" && (
        <div className="mt-8 flex items-start gap-2 rounded-lg border border-blue-100/30 bg-blue-100/5 px-4 py-3">
          <span
            className="material-symbols-outlined shrink-0 text-blue-100"
            style={{ fontSize: 20 }}
          >
            info
          </span>
          <p className="text-sm text-black-80">
            <span className="font-medium text-blue-100">
              Motivo da devolução:
            </span>{" "}
            {doc.devolveObservation}
          </p>
        </div>
      )}

      <div className="mt-8 flex w-full flex-col gap-12">
        <FormSection title="1. Identificação">
          <div className="grid grid-cols-2 items-start gap-6 max-md:grid-cols-1">
            <div className="flex flex-col gap-6">
              <FormField
                id="teacherName"
                label="Nome completo do/a docente"
                required
                error={errors.teacherName}
              >
                <Input
                  id="teacherName"
                  value={content.teacherName}
                  onChange={(e) => update("teacherName", e.target.value)}
                  placeholder="Digite o nome completo"
                  disabled={readonly}
                  error={!!errors.teacherName}
                />
              </FormField>

              <DynamicInputList
                title="Sugestões de nomes da trilha"
                placeholder="Sugira um nome para a trilha..."
                values={content.trailNameSuggestions}
                onChange={(values) => update("trailNameSuggestions", values)}
                disabled={readonly}
                max={3}
              />

              <DynamicInputList
                title="Subáreas"
                placeholder="Digite uma subárea..."
                values={content.subareas}
                onChange={(values) => update("subareas", values)}
                disabled={readonly}
              />
            </div>

            <div className="flex flex-col gap-6">
              <FormField id="greatArea" label="Grande área">
                <MultiSelectDropdown
                  id="greatArea"
                  label="Grande área"
                  icon="category"
                  placeholder="Selecione a grande área"
                  multiple={false}
                  options={GREAT_AREA_OPTIONS}
                  selected={content.greatArea ? [content.greatArea] : []}
                  onChange={(selected) => update("greatArea", selected[0] ?? "")}
                  disabled={readonly}
                  size="md"
                />
              </FormField>

              <FormField id="career" label="Carreiras">
                <MultiSelectDropdown
                  id="career"
                  label="Carreiras"
                  icon="flowchart"
                  placeholder="Selecione a carreira"
                  multiple={false}
                  options={CAREER_FIELD_OPTIONS}
                  selected={content.career ? [content.career] : []}
                  onChange={(selected) => update("career", selected[0] ?? "")}
                  disabled={readonly}
                  size="md"
                />
              </FormField>

            <FormField
              id="trailPresentation"
              label="Texto de apresentação da trilha"
            >
              <Textarea
                id="trailPresentation"
                value={content.trailPresentation}
                onChange={(value) => update("trailPresentation", value)}
                placeholder="Escreva a apresentação..."
                maxLength={300}
                hint="Descreva brevemente a proposta da trilha."
                disabled={readonly}
              />
            </FormField>
            </div>
          </div>
        </FormSection>

        <FormSection title="2. Estrutura Operacional">
          <div className="flex flex-col gap-6">
            <FormField id="executionPeriod" label="Período de execução">
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <Input
                  id="executionPeriod"
                  type="date"
                  value={content.executionPeriod.start}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      executionPeriod: { ...prev.executionPeriod, start: e.target.value },
                    }))
                  }
                  placeholder="Início"
                  label="Início"
                  disabled={readonly}
                />
                <Input
                  id="executionPeriod-end"
                  type="date"
                  value={content.executionPeriod.end}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      executionPeriod: { ...prev.executionPeriod, end: e.target.value },
                    }))
                  }
                  placeholder="Fim"
                  label="Término"
                  disabled={readonly}
                />
              </div>
            </FormField>

            <FormField id="syncTime" label="Horário de encontros síncronos">
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <Input
                  id="syncTime"
                  type="time"
                  value={content.syncTime.start}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      syncTime: { ...prev.syncTime, start: e.target.value },
                    }))
                  }
                  placeholder="Início"
                  label="Início"
                  disabled={readonly}
                />
                <Input
                  id="syncTime-end"
                  type="time"
                  value={content.syncTime.end}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      syncTime: { ...prev.syncTime, end: e.target.value },
                    }))
                  }
                  placeholder="Fim"
                  label="Término"
                  disabled={readonly}
                />
              </div>
            </FormField>

            <FormField id="modality" label="Modalidade">
              <MultiSelectDropdown
                id="modality"
                label="Modalidade"
                icon="location_on"
                placeholder="Selecione a modalidade"
                multiple={false}
                options={MODALITY_OPTIONS}
                selected={content.modality ? [content.modality] : []}
                onChange={(selected) => update("modality", selected[0] ?? "")}
                disabled={readonly}
                size="md"
              />
            </FormField>

            <CheckboxGroup
              id="targetAudience"
              title="Público-alvo"
              selectionMode="multiple"
              options={TARGET_AUDIENCE_OPTIONS}
              value={content.targetAudience}
              onChange={(value) => update("targetAudience", value as string[])}
              disabled={readonly}
            />

            <FormField id="workload" label="Carga horária">
              <MultiSelectDropdown
                id="workload"
                label="Carga horária"
                icon="schedule"
                placeholder="Selecione a carga horária"
                multiple={false}
                options={WORKLOAD_OPTIONS}
                selected={content.workload ? [content.workload] : []}
                onChange={(selected) => update("workload", selected[0] ?? "")}
                disabled={readonly}
                size="md"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="3. Requisitos e Infraestrutura">
          <div className="flex flex-col gap-6">
            <CheckboxList
              id="syncMeetingDates"
              title="Datas encontros síncronos (presencial ou on-line)"
              value={content.syncMeetingDates}
              onChange={(value) => update("syncMeetingDates", value)}
              placeholder="Ex.: 10/09, 17/09, 24/09"
              disabled={readonly}
            />
            <CheckboxList
              id="softwareTypes"
              title="Tipo de softwares necessários"
              value={content.softwareTypes}
              onChange={(value) => update("softwareTypes", value)}
              placeholder="Ex.: Visual Studio Code, GitHub"
              disabled={readonly}
            />
            <CheckboxList
              id="suggestedVacancies"
              title="Sugestão de número de vagas"
              value={content.suggestedVacancies}
              onChange={(value) => update("suggestedVacancies", value)}
              placeholder="Ex.: 40 vagas"
              disabled={readonly}
            />
            <CheckboxList
              id="equipmentTypes"
              title="Tipo de equipamentos necessários"
              value={content.equipmentTypes}
              onChange={(value) => update("equipmentTypes", value)}
              placeholder="Ex.: Notebook, Arduino"
              disabled={readonly}
            />
            <CheckboxList
              id="prerequisites"
              title="Pré-requisitos"
              value={content.prerequisites}
              onChange={(value) => update("prerequisites", value)}
              placeholder="Ex.: Lógica de programação"
              disabled={readonly}
            />
            <CheckboxList
              id="enrollmentNumber"
              title="Número de inscrições"
              value={content.enrollmentNumber}
              onChange={(value) => update("enrollmentNumber", value)}
              placeholder="Ex.: 40"
              disabled={readonly}
            />
            <CheckboxList
              id="matriculationNumber"
              title="Número de matrículas"
              value={content.matriculationNumber}
              onChange={(value) => update("matriculationNumber", value)}
              placeholder="Ex.: 2000"
              disabled={readonly}
            />
            <FormField
              id="participationStatementFrequency"
              label="Frequência sugerida para emissão de declaração de participação"
            >
              <Textarea
                id="participationStatementFrequency"
                value={content.participationStatementFrequency}
                onChange={(value) => update("participationStatementFrequency", value)}
                placeholder="Descreva a frequência..."
                maxLength={110}
                disabled={readonly}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="4. Modelo Pedagógico">
          <div className="flex flex-col gap-6">
            <FormField id="level" label="Nível">
              <MultiSelectDropdown
                id="level"
                label="Nível"
                icon="signal_cellular_alt"
                placeholder="Selecione o nível"
                multiple={false}
                options={LEVEL_OPTIONS}
                selected={content.level ? [content.level] : []}
                onChange={(selected) => update("level", selected[0] ?? "")}
                disabled={readonly}
                size="md"
              />
            </FormField>

            <FormField
              id="technicalCompetencies"
              label="Competências técnicas"
            >
              <Textarea
                id="technicalCompetencies"
                value={content.technicalCompetencies}
                onChange={(value) => update("technicalCompetencies", value)}
                placeholder="Descreva as competências técnicas..."
                maxLength={110}
                disabled={readonly}
              />
            </FormField>

            <CheckboxGroup
              id="nonTechnicalCompetencies"
              title="Competências não técnicas"
              selectionMode="multiple"
              options={NON_TECHNICAL_COMPETENCY_OPTIONS}
              value={content.nonTechnicalCompetencies}
              onChange={(value) => update("nonTechnicalCompetencies", value as string[])}
              disabled={readonly}
            />

            <CheckboxGroup
              id="curriculumNature"
              title="Natureza do componente curricular (dimensão do conhecimento)"
              selectionMode="multiple"
              options={CURRICULUM_NATURE_OPTIONS}
              value={content.curriculumNature}
              onChange={(value) => update("curriculumNature", value as string[])}
              disabled={readonly}
            />
          </div>
        </FormSection>
      </div>

      <ConfirmDialog
        open={devolveOpen}
        title="Devolver para correção"
        message="Descreva opcionalmente o motivo da devolução."
        confirmLabel="Devolver"
        onConfirm={confirmDevolve}
        onCancel={() => setDevolveOpen(false)}
      >
        <Textarea
          id="devolveObservation"
          value={devolveNote}
          onChange={setDevolveNote}
          placeholder="Observações (opcional)"
          maxLength={500}
        />
      </ConfirmDialog>
    </>
  );
}

function initialsFrom(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  const first = words[0][0] ?? "";
  const second = words.length > 1 ? words[1][0] ?? "" : words[0][1] ?? "";
  return `${first}${second}`.toUpperCase() || "??";
}

function EditorSkeleton() {
  return (
    <div className="pt-12">
      <div className="mb-8">
        <div className="h-5 w-32 animate-pulse rounded-lg bg-black-20" />
        <div className="mt-4 flex items-center gap-4">
          <div className="size-12 animate-pulse rounded-full bg-black-20" />
          <div className="flex-1">
            <div className="h-7 w-64 animate-pulse rounded-lg bg-black-20" />
            <div className="mt-2 h-4 w-40 animate-pulse rounded-lg bg-black-20" />
          </div>
        </div>
      </div>
      {[0, 1, 2, 3].map((i) => (
        <FormSection key={i} title="" skeleton />
      ))}
    </div>
  );
}
