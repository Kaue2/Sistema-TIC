import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent,
} from "react";
import axios from "axios";
import { AttachmentService } from "../../services/document/AttachmentService";
import type { ReportAnnex } from "../../types/attachment";

type AttachmentStep = {
  code: string;
  label: string;
  stageCode: string;
};

const ATTACHMENT_STEPS: AttachmentStep[] = [
  { code: "MATERIAL_INSTRUCIONAL_AMOSTRA", label: "Material instrucional", stageCode: "M1.13" },
  { code: "ATIVIDADE_AVALIATIVA", label: "Atividade avaliativa", stageCode: "M1.13" },
  { code: "PLANO_ENSINO", label: "Plano de ensino", stageCode: "M1.14" },
  { code: "PESQUISA_SATISFACAO_OPINA_AI", label: "Pesquisa de satisfação", stageCode: "M1.15" },
  { code: "EVIDENCIA_AMBIENTE_VIRTUAL", label: "Ambiente virtual", stageCode: "M1.15" },
  { code: "RESUMO_INSCRICOES", label: "Resumo das inscrições", stageCode: "M2.1" },
  { code: "LISTA_PRESENCA", label: "Lista de presença", stageCode: "M2.2" },
  { code: "MODELO_DECLARACAO_PARTICIPACAO", label: "Modelo de declaração", stageCode: "M2.6" },
  { code: "EMAIL_DECLARACAO_PARTICIPACAO", label: "E-mail da declaração", stageCode: "M2.6" },
];

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const EMPTY_FILES: File[] = [];
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
]);

type AttachmentUploadWizardProps = {
  documentId?: string;
  onToast: (message: string, type: "success" | "error" | "info") => void;
};

export type AttachmentUploadWizardHandle = {
  saveCurrentStep: () => Promise<boolean>;
};

function isUuid(value?: string) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? "Não foi possível processar os anexos.";
  }
  return error instanceof Error ? error.message : "Não foi possível processar os anexos.";
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function displayType(file: File) {
  const extension = file.name.split(".").pop();
  return extension ? extension.toUpperCase() : file.type.replace("image/", "").toUpperCase();
}

export const AttachmentUploadWizard = forwardRef<
  AttachmentUploadWizardHandle,
  AttachmentUploadWizardProps
>(function AttachmentUploadWizard({ documentId, onToast }, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const loadRequestRef = useRef(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [filesByStep, setFilesByStep] = useState<Record<string, File[]>>({});
  const [storedAnnexes, setStoredAnnexes] = useState<ReportAnnex[]>([]);
  const [isStageEditable, setIsStageEditable] = useState<boolean>();
  const [loadingStoredAnnexes, setLoadingStoredAnnexes] = useState(false);
  const [storedAnnexesError, setStoredAnnexesError] = useState<string>();
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingAnnexId, setDeletingAnnexId] = useState<string>();
  const step = ATTACHMENT_STEPS[currentStep];
  const files = filesByStep[step.code] ?? EMPTY_FILES;
  const isLastStep = currentStep === ATTACHMENT_STEPS.length - 1;
  const canPersist = isUuid(documentId);

  const loadStoredAnnexes = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    if (!documentId || !canPersist) {
      if (requestId !== loadRequestRef.current) return;
      setStoredAnnexes([]);
      setIsStageEditable(true);
      setStoredAnnexesError(undefined);
      return;
    }

    setLoadingStoredAnnexes(true);
    setStoredAnnexesError(undefined);
    try {
      const stage = await AttachmentService.getStage(documentId, step.stageCode);
      if (requestId !== loadRequestRef.current) return;
      const attachmentType = stage.attachmentTypes.find((item) => item.code === step.code);
      setStoredAnnexes(attachmentType?.annexes ?? []);
      setIsStageEditable(stage.isEditable);
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;
      setStoredAnnexes([]);
      setIsStageEditable(false);
      setStoredAnnexesError(errorMessage(error));
    } finally {
      if (requestId === loadRequestRef.current) setLoadingStoredAnnexes(false);
    }
  }, [canPersist, documentId, step.code, step.stageCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStoredAnnexes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadStoredAnnexes]);

  const canAddFiles =
    !saving &&
    !deletingAnnexId &&
    (!canPersist || (!loadingStoredAnnexes && isStageEditable === true));

  function addFiles(nextFiles: File[]) {
    if (!canAddFiles) {
      onToast(
        loadingStoredAnnexes
          ? "Aguarde o carregamento dos anexos desta etapa."
          : "Este relatório não está em um estado editável.",
        "info"
      );
      return;
    }

    const invalid = nextFiles.find(
      (file) => !ACCEPTED_TYPES.has(file.type) || file.size === 0 || file.size > MAX_FILE_SIZE
    );
    if (invalid) {
      onToast(`${invalid.name} não é uma imagem aceita ou excede o limite de 15 MB.`, "error");
      return;
    }

    if (files.length + nextFiles.length > 20) {
      onToast("Cada etapa aceita no máximo 20 imagens por envio.", "error");
      return;
    }

    setFilesByStep((current) => ({
      ...current,
      [step.code]: [...(current[step.code] ?? []), ...nextFiles],
    }));
  }

  function removeFile(index: number) {
    if (!canAddFiles) return;
    setFilesByStep((current) => ({
      ...current,
      [step.code]: (current[step.code] ?? []).filter((_, fileIndex) => fileIndex !== index),
    }));
  }

  const persistCurrentStep = useCallback(async () => {
    if (!documentId || !canPersist || files.length === 0) return true;

    setSaving(true);
    let annexId: string | undefined;
    try {
      annexId = await AttachmentService.createAnnex(documentId, {
        stageCode: step.stageCode,
        attachmentTypeCode: step.code,
        title: step.label,
      });
      await AttachmentService.uploadImages(documentId, annexId, files);
      setFilesByStep((current) => ({ ...current, [step.code]: [] }));
      await loadStoredAnnexes();
      onToast("Arquivos enviados e registrados no relatório.", "success");
      return true;
    } catch (error) {
      if (annexId) await AttachmentService.deleteAnnex(documentId, annexId).catch(() => undefined);
      onToast(errorMessage(error), "error");
      return false;
    } finally {
      setSaving(false);
    }
  }, [canPersist, documentId, files, loadStoredAnnexes, onToast, step.code, step.label, step.stageCode]);

  const saveCurrentStep = useCallback(async () => {
    if (saving) return false;
    if (files.length === 0) {
      onToast("Não há novos arquivos para salvar nesta etapa.", "info");
      return true;
    }
    if (!canPersist) {
      onToast("A trilha de demonstração não possui um documento Softex no servidor para receber estes arquivos.", "info");
      return false;
    }
    return persistCurrentStep();
  }, [canPersist, files.length, onToast, persistCurrentStep, saving]);

  useImperativeHandle(ref, () => ({ saveCurrentStep }), [saveCurrentStep]);

  async function advance() {
    if (saving) return;

    if (files.length > 0) {
      const saved = await saveCurrentStep();
      if (!saved) return;
    }

    if (isLastStep) {
      onToast("Todas as etapas de importação foram concluídas.", "success");
      return;
    }
    setCurrentStep((current) => current + 1);
  }

  async function deleteStoredAnnex(annex: ReportAnnex) {
    if (!documentId || !canPersist) return;
    if (!window.confirm(`Excluir o anexo “${annex.title}” e todas as suas imagens?`)) return;

    setDeletingAnnexId(annex.id);
    try {
      await AttachmentService.deleteAnnex(documentId, annex.id);
      await loadStoredAnnexes();
      onToast("Anexo removido.", "success");
    } catch (error) {
      onToast(errorMessage(error), "error");
    } finally {
      setDeletingAnnexId(undefined);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!canAddFiles) return;
    addFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <section aria-label="Importação de anexos" className="mt-14">
      <h2 className="text-2xl font-medium text-blue-100">Importação de anexos</h2>
      <p className="mt-1 text-sm text-black-60">
        Adicione os arquivos indicados em cada etapa do relatório. O envio é opcional e pode ser retomado depois.
      </p>

      <div className="mt-10 overflow-x-auto pb-3">
        <ol className="flex min-w-max items-center px-1" aria-label="Etapas de importação">
          {ATTACHMENT_STEPS.map((item, index) => {
            const isCurrent = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <li key={item.code} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  disabled={saving || Boolean(deletingAnnexId)}
                  aria-current={isCurrent ? "step" : undefined}
                  className="flex items-center gap-2 whitespace-nowrap text-xs text-black-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span
                    className={`material-symbols-outlined ${isCurrent || isComplete ? "text-blue-100" : "text-black-40"}`}
                    style={{
                      fontSize: 20,
                      fontVariationSettings: `'FILL' ${isCurrent || isComplete ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 20`,
                    }}
                  >
                    check_circle
                  </span>
                  <span className={isCurrent ? "font-medium text-black-80" : undefined}>{item.label}</span>
                </button>
                {index < ATTACHMENT_STEPS.length - 1 && (
                  <span aria-hidden="true" className="mx-4 h-px w-8 bg-black-40" />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-12 max-w-4xl rounded-xl border border-blue-100/25 bg-card-background p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
              Etapa {currentStep + 1} de {ATTACHMENT_STEPS.length}
            </p>
            <h3 className="mt-1 text-xl font-medium text-black-90">{step.label}</h3>
            <p className="mt-1 text-sm text-black-60">
              Insira imagens JPEG, PNG, WebP, BMP ou TIFF, com até 15 MB por arquivo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={!canAddFiles}
            className="flex h-9 items-center gap-2 rounded-lg border border-blue-100 px-3 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Inserir arquivos
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,.tif,.tiff"
            className="hidden"
            onChange={(event) => {
              addFiles(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        </div>

        <div
          className={`mt-6 overflow-hidden rounded-lg border border-dashed transition-colors ${
            isDragging ? "border-blue-100 bg-blue-100/10" : "border-blue-100/45"
          }`}
          onDragEnter={(event) => {
            event.preventDefault();
            if (canAddFiles) setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setIsDragging(false);
          }}
          onDrop={handleDrop}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_88px_72px_40px] gap-3 bg-blue-100/5 px-4 py-2 text-xs font-medium text-black-60">
            <span>Arquivos a enviar</span>
            <span>Tamanho</span>
            <span>Formato</span>
            <span className="sr-only">Remover</span>
          </div>
          {files.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-black-50">
              Arraste arquivos para esta área ou use o botão “Inserir arquivos”.
            </p>
          ) : (
            <ul>
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="grid grid-cols-[minmax(0,1fr)_88px_72px_40px] items-center gap-3 border-t border-black-10 px-4 py-3 text-sm text-black-70">
                  <span className="truncate" title={file.name}>{file.name}</span>
                  <span>{formatBytes(file.size)}</span>
                  <span>{displayType(file)}</span>
                  <button
                    type="button"
                    aria-label={`Remover ${file.name}`}
                    onClick={() => removeFile(index)}
                    disabled={!canAddFiles}
                    className="flex size-8 items-center justify-center rounded-full text-red-100 hover:bg-red-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <section className="mt-6" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-medium text-black-80">Anexos já salvos</h4>
            {loadingStoredAnnexes && <span className="text-xs text-black-50">Atualizando...</span>}
          </div>
          {storedAnnexesError ? (
            <p className="mt-2 text-sm text-red-100">{storedAnnexesError}</p>
          ) : storedAnnexes.length === 0 ? (
            <p className="mt-2 text-sm text-black-50">Nenhum anexo salvo nesta etapa.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {storedAnnexes.map((annex) => (
                <article key={annex.id} className="rounded-lg border border-black-10 bg-black-5 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-black-80">{annex.title}</p>
                      <p className="mt-0.5 text-xs text-black-50">
                        {annex.images.length} imagem(ns) · {annex.questionCodes.join(" · ")}
                      </p>
                    </div>
                    {canPersist && isStageEditable && (
                      <button
                        type="button"
                        disabled={saving || deletingAnnexId === annex.id}
                        onClick={() => void deleteStoredAnnex(annex)}
                        className="text-xs font-medium text-red-100 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deletingAnnexId === annex.id ? "Excluindo..." : "Excluir anexo"}
                      </button>
                    )}
                  </div>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {annex.images.map((image) => (
                      <li key={image.id} className="flex items-center justify-between gap-3 rounded bg-card-background px-2.5 py-2 text-xs text-black-60">
                        <span className="truncate" title={image.originalFileName}>{image.originalFileName}</span>
                        <span className="shrink-0">{formatBytes(image.sizeBytes)}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-5 flex justify-between gap-3">
          <button
            type="button"
            disabled={currentStep === 0 || saving || Boolean(deletingAnnexId)}
            onClick={() => setCurrentStep((current) => current - 1)}
            className="flex h-9 items-center gap-1 rounded-lg border border-blue-100 px-3 text-sm text-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Voltar
          </button>
          <button
            type="button"
            disabled={saving || loadingStoredAnnexes || Boolean(deletingAnnexId)}
            onClick={() => void advance()}
            className="flex h-9 items-center gap-1 rounded-lg bg-blue-100 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Enviando..." : isLastStep ? "Concluir" : "Avançar"}
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {isLastStep ? "check" : "arrow_forward"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
});
