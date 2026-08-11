import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DocumentHeader } from "../components/organisms/DocumentHeader";
import { ConfirmDialog } from "../components/molecules/ConfirmDialog";
import { FormSection } from "../components/molecules/FormSection";
import { FormField } from "../components/molecules/FormField";
import { FormCard } from "../components/molecules/FormCard";
import { Input } from "../components/atoms/Input";
import { Textarea } from "../components/atoms/Textarea";
import { Button } from "../components/atoms/Button";
import { useDocumentForm } from "../hooks/useDocumentForm";
import { useDocumentEditorActions } from "../hooks/useDocumentEditorActions";
import {
  emptyPlanoEnsinoContent,
  emptyPlanoEnsinoCard,
  emptyPlanoEnsinoModule,
  type StoredDocument,
} from "../services/document/DocumentService";
import {
  validatePlanoEnsinoContent,
  hasPlanoEnsinoErrors,
  type PlanoEnsinoErrors,
} from "../services/document/PlanoEnsinoValidation";
import type { PlanoEnsinoContent, PlanoEnsinoCard, DocumentMode, DocumentType } from "../types/document";
import type { ToastType } from "../components/organisms/Toast";
import { initialsFrom } from "../utils/initials";
import {
  ESTRUTURA_GERAL_FIELDS,
  CARD_FIELDS,
  MODULE_MAX_TITLE_LENGTH,
  type PlanoEnsinoStringField,
} from "../data/planoEnsinoFields";

type PlanoEnsinoFormProps = {
  mode: DocumentMode;
  document: StoredDocument<PlanoEnsinoContent> | null;
  type: DocumentType;
  onToast: (message: string, type: ToastType) => void;
};

export function PlanoEnsinoForm({
  mode,
  document,
  type,
  onToast,
}: PlanoEnsinoFormProps) {
  const navigate = useNavigate();
  const [moduleToRemove, setModuleToRemove] = useState<number | null>(null);
  const [cardToRemove, setCardToRemove] = useState<{
    m: number;
    c: number;
  } | null>(null);
  const { content, setContent, errors, status, isBusy, save, sendToReview, devolve, close, reopen, archive, restore } =
    useDocumentForm<PlanoEnsinoContent, PlanoEnsinoErrors>({
      document,
      type,
      empty: emptyPlanoEnsinoContent,
      emptyErrors: () => ({ presentation: undefined, moduleTitles: [] }),
      validate: validatePlanoEnsinoContent,
      hasErrors: hasPlanoEnsinoErrors,
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

  function update(field: PlanoEnsinoStringField, value: string) {
    setContent((prev) => ({ ...prev, [field]: value }));
  }

  function updateModuleTitle(index: number, value: string) {
    setContent((prev) => ({
      ...prev,
      modules: prev.modules.map((module, i) =>
        i === index ? { ...module, title: value } : module
      ),
    }));
  }

  function updateCard(
    moduleIndex: number,
    cardIndex: number,
    field: keyof PlanoEnsinoCard,
    value: string
  ) {
    setContent((prev) => ({
      ...prev,
      modules: prev.modules.map((module, m) =>
        m === moduleIndex
          ? {
              ...module,
              cards: module.cards.map((card, c) =>
                c === cardIndex ? { ...card, [field]: value } : card
              ),
            }
          : module
      ),
    }));
  }

  function addModule() {
    setContent((prev) => ({
      ...prev,
      modules: [...prev.modules, emptyPlanoEnsinoModule()],
    }));
  }

  function removeModule(index: number) {
    setContent((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index),
    }));
  }

  function addCard(moduleIndex: number) {
    setContent((prev) => ({
      ...prev,
      modules: prev.modules.map((module, m) =>
        m === moduleIndex
          ? { ...module, cards: [...module.cards, emptyPlanoEnsinoCard()] }
          : module
      ),
    }));
  }

  function removeCard(moduleIndex: number, cardIndex: number) {
    setContent((prev) => ({
      ...prev,
      modules: prev.modules.map((module, m) =>
        m === moduleIndex
          ? {
              ...module,
              cards: module.cards.filter((_, c) => c !== cardIndex),
            }
          : module
      ),
    }));
  }

  const title = mode === "create" ? "Novo documento" : doc!.title;
  const subtitle =
    mode === "create" ? "Plano de Ensino" : `${doc!.type} · ${doc!.number}`;
  const initials = initialsFrom(title);

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
            ? () => navigate(`/documents/${doc!.id}/edit`)
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
        <FormSection title="Estrutura Geral">
          <div className="flex flex-col gap-6">
            {ESTRUTURA_GERAL_FIELDS.map((field) => (
              <FormField
                key={field.id}
                id={field.id}
                label={field.label}
                required={field.id === "presentation"}
                error={
                  field.id === "presentation" ? errors.presentation : undefined
                }
              >
                  <Textarea
                    id={field.id}
                    value={content[field.id]}
                    onChange={(value) => update(field.id, value)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    hint={field.description}
                    disabled={readonly}
                    autoGrow
                  />
              </FormField>
            ))}
          </div>
        </FormSection>

        <FormSection title="Módulos">
          <div className="flex flex-col gap-6">
            {content.modules.map((module, m) => (
              <div key={m} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-normal text-blue-100">
                    Módulo {m + 1}
                  </h3>
                  {!readonly && (
                    <Button
                      variant="outline"
                      icon="delete"
                      onClick={() => setModuleToRemove(m)}
                      disabled={content.modules.length <= 1}
                    >
                      Remover módulo
                    </Button>
                  )}
                </div>

                <FormField
                  id={`module-${m}-title`}
                  label="Título do módulo"
                  error={errors.moduleTitles[m]}
                >
                  <Input
                    id={`module-${m}-title`}
                    value={module.title}
                    onChange={(e) => updateModuleTitle(m, e.target.value)}
                    maxLength={MODULE_MAX_TITLE_LENGTH}
                    helperText={`Adicione um título para o módulo ${m + 1}.`}
                    disabled={readonly}
                    error={!!errors.moduleTitles[m]}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                  {module.cards.map((card, c) => (
                    <FormCard key={c}>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-normal text-blue-100">
                            Card {c + 1}
                          </h4>
                          {!readonly && (
                            <Button
                              variant="outline"
                              icon="delete"
                              onClick={() => setCardToRemove({ m, c })}
                              disabled={module.cards.length <= 1}
                            >
                              Remover card
                            </Button>
                          )}
                        </div>

                        <div className="flex flex-col gap-6">
                          {CARD_FIELDS.map((field) => (
                            <FormField
                              key={field.id}
                              id={`module-${m}-card-${c}-${field.id}`}
                              label={field.label}
                            >
                              <Textarea
                                id={`module-${m}-card-${c}-${field.id}`}
                                value={card[field.id]}
                                onChange={(value) =>
                                  updateCard(m, c, field.id, value)
                                }
                                placeholder={field.placeholder}
                                maxLength={field.maxLength}
                                hint={field.description}
                                disabled={readonly}
                                autoGrow
                              />
                            </FormField>
                          ))}
                        </div>
                      </div>
                    </FormCard>
                  ))}

                  {!readonly && (
                    <button
                      type="button"
                      onClick={() => addCard(m)}
                      className="flex min-h-48 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-40 bg-card-background text-sm text-blue-100 transition-all duration-200 hover:border-blue-100 hover:bg-blue-100/5"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18 }}
                      >
                        add
                      </span>
                      Adicionar card
                    </button>
                  )}
                </div>
              </div>
            ))}

            {!readonly && (
              <button
                type="button"
                onClick={addModule}
                className="flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-40 bg-card-background text-sm text-blue-100 transition-all duration-200 hover:border-blue-100 hover:bg-blue-100/5"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18 }}
                >
                  add
                </span>
                Adicionar módulo
              </button>
            )}
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

      <ConfirmDialog
        open={moduleToRemove !== null}
        title="Remover módulo"
        message={
          moduleToRemove !== null
            ? `Remover o módulo ${moduleToRemove + 1}? Todos os dados desse módulo serão perdidos.`
            : ""
        }
        confirmLabel="Remover"
        confirmVariant="danger"
        onConfirm={() => {
          if (moduleToRemove !== null) removeModule(moduleToRemove);
          setModuleToRemove(null);
        }}
        onCancel={() => setModuleToRemove(null)}
      />

      <ConfirmDialog
        open={cardToRemove !== null}
        title="Remover card"
        message={
          cardToRemove !== null
            ? `Remover o card ${cardToRemove.c + 1} do módulo ${cardToRemove.m + 1}? Todos os dados desse card serão perdidos.`
            : ""
        }
        confirmLabel="Remover"
        confirmVariant="danger"
        onConfirm={() => {
          if (cardToRemove !== null) removeCard(cardToRemove.m, cardToRemove.c);
          setCardToRemove(null);
        }}
        onCancel={() => setCardToRemove(null)}
      />
    </>
  );
}
