import { useNavigate } from "react-router-dom";
import { DocumentHeader } from "../components/organisms/DocumentHeader";
import { ConfirmDialog } from "../components/molecules/ConfirmDialog";
import { FormSection } from "../components/molecules/FormSection";
import { FormField } from "../components/molecules/FormField";
import { CheckboxGroup } from "../components/molecules/CheckboxGroup";
import { CheckboxList } from "../components/molecules/CheckboxList";
import { DynamicInputList } from "../components/molecules/DynamicInputList";
import { MultiSelectDropdown } from "../components/molecules/MultiSelectDropdown";
import { Input } from "../components/atoms/Input";
import { Textarea } from "../components/atoms/Textarea";
import { useDocumentForm } from "../hooks/useDocumentForm";
import { useDocumentEditorActions } from "../hooks/useDocumentEditorActions";
import {
  emptyContent,
  type StoredDocument,
} from "../services/document/DocumentService";
import {
  validateContent,
  type DocumentFieldErrors,
} from "../services/document/DocumentValidation";
import type { DocumentContent, DocumentMode, DocumentType } from "../types/document";
import { initialsFrom } from "../utils/initials";
import type { ToastType } from "../components/organisms/Toast";
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

type EscopoDocumentFormProps = {
  mode: DocumentMode;
  document: StoredDocument | null;
  type: DocumentType;
  onToast: (message: string, type: ToastType) => void;
};

export function EscopoDocumentForm({
  mode,
  document,
  type,
  onToast,
}: EscopoDocumentFormProps) {
  const navigate = useNavigate();
  const { content, setContent, errors, status, isBusy, save, sendToReview, devolve, close, reopen, archive, restore } =
    useDocumentForm<DocumentContent, DocumentFieldErrors>({
      document,
      type,
      empty: emptyContent,
      emptyErrors: () => ({}),
      validate: validateContent,
      hasErrors: (e) => Object.keys(e).length > 0,
      getCareer: (c) => c.career,
    });
  const actions = useDocumentEditorActions({
    mode,
    save,
    sendToReview,
    devolve,
    close,
    reopen,
    archive,
    restore,
    onToast,
  });

  const readonly = mode === "view" || mode === "review";
  const doc = document;

  function update(field: keyof DocumentContent, value: DocumentContent[keyof DocumentContent]) {
    setContent((prev) => ({ ...prev, [field]: value }));
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
        onSave={mode === "create" || mode === "edit" ? actions.handleSave : undefined}
        onSendToReview={
          mode === "create" || mode === "edit"
            ? actions.handleSendToReview
            : undefined
        }
        onDevolve={mode === "review" ? actions.openDevolveDialog : undefined}
        onClose={mode === "review" ? actions.handleClose : undefined}
        onEdit={
          mode === "view" &&
          status !== "Arquivado" &&
          status !== "Concluído"
            ? () => navigate(`/documents/${doc!.id}/edit?type=${encodeURIComponent(doc!.type)}`)
            : undefined
        }
        onReopen={
          mode === "view" && status === "Concluído" ? actions.handleReopen : undefined
        }
        onArchive={
          mode !== "create" && status !== "Arquivado" && status !== "Concluído"
            ? actions.handleArchive
            : undefined
        }
        onRestore={
          mode === "view" && status === "Arquivado" ? actions.handleRestore : undefined
        }
        onExport={
          mode === "view" && status === "Concluído" ? actions.handleExport : undefined
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

              <DynamicInputList
                title="Sugestões de nomes da trilha"
                placeholder="Sugira um nome para a trilha..."
                values={content.trailNameSuggestions}
                onChange={(values) => update("trailNameSuggestions", values)}
                disabled={readonly}
                max={3}
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

              <DynamicInputList
                title="Subáreas"
                placeholder="Digite uma subárea..."
                values={content.subareas}
                onChange={(values) => update("subareas", values)}
                disabled={readonly}
              />

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
        open={actions.devolveOpen}
        title="Devolver para correção"
        message="Descreva opcionalmente o motivo da devolução."
        confirmLabel="Devolver"
        onConfirm={actions.confirmDevolve}
        onCancel={() => actions.setDevolveOpen(false)}
      >
        <Textarea
          id="devolveObservation"
          value={actions.devolveNote}
          onChange={actions.setDevolveNote}
          placeholder="Observações (opcional)"
          maxLength={500}
        />
      </ConfirmDialog>
    </>
  );
}
