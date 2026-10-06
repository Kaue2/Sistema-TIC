import type {
  Document,
  DocumentContent,
  DocumentStatusValue,
  DocumentType,
  PlanoEnsinoCard,
  PlanoEnsinoContent,
  PlanoEnsinoModule,
  SoftexContent,
  SoftexItem,
  SoftexMeta,
} from "../../types/document";
import { isAxiosError } from "axios";
import { mockDocuments } from "../../data/mockDocuments";
import { SOFTEX_METAS, type SoftexItemSeed, type SoftexMetaSeed } from "../../data/softexFields";
import { SOFTEX_INTRODUCTION_DEFAULT } from "../../data/softexIntroFields";
import {
  getTrackDocumentContent,
  saveTrackDocumentContent,
  submitTrackDocumentForReview,
  transitionTrackDocument,
  type DocumentTransitionAction,
  type TrackDocumentContentDTO,
} from "../document-services";

export function emptySoftexItem(item: SoftexItemSeed): SoftexItem {
  return { ...item, answer: "" };
}

export function emptySoftexMeta(meta: SoftexMetaSeed): SoftexMeta {
  return {
    ...meta,
    metadata: { ...meta.metadata },
    beforeItems: meta.beforeItems.map(emptySoftexItem),
    afterItems: meta.afterItems.map(emptySoftexItem),
  };
}

export function emptySoftexContent(): SoftexContent {
  return {
    intro: { ...SOFTEX_INTRODUCTION_DEFAULT },
    metas: SOFTEX_METAS.map(emptySoftexMeta),
  };
}

export function emptyPlanoEnsinoCard(): PlanoEnsinoCard {
  return {
    objectives: "",
    classTheme: "",
    contentList: "",
    evaluationStrategy: "",
    resources: "",
    workloadModality: "",
  };
}

export function emptyPlanoEnsinoModule(): PlanoEnsinoModule {
  return {
    title: "",
    cards: [emptyPlanoEnsinoCard()],
  };
}

export function emptyPlanoEnsinoContent(): PlanoEnsinoContent {
  return {
    presentation: "",
    generalObjectives: "",
    basicBibliography: "",
    complementaryBibliography: "",
    trailContext: "",
    modules: [emptyPlanoEnsinoModule()],
  };
}

export function emptyContent(): DocumentContent {
  return {
    teacherName: "",
    career: "",
    greatArea: "",
    subareas: [],
    trailNameSuggestions: [],
    trailPresentation: "",
    executionPeriod: { start: "", end: "" },
    syncTime: { start: "", end: "" },
    modality: "",
    targetAudience: [],
    workload: "",
    syncMeetingDates: { mode: "none", items: [] },
    softwareTypes: { mode: "none", items: [] },
    suggestedVacancies: { mode: "none", items: [] },
    equipmentTypes: { mode: "none", items: [] },
    prerequisites: { mode: "none", items: [] },
    enrollmentNumber: { mode: "none", items: [] },
    participationStatementFrequency: "",
    matriculationNumber: { mode: "none", items: [] },
    level: "",
    technicalCompetencies: "",
    nonTechnicalCompetencies: [],
    curriculumNature: [],
  };
}

type StoredDocument<C extends object = DocumentContent> = Document & {
  content: C;
  devolveObservation?: string;
};

const store = new Map<string, StoredDocument>();

const EMPTY_CONTENT_BY_TYPE: Record<DocumentType, () => object> = {
  "Escopo e Proposta": emptyContent,
  "Plano de Ensino": emptyPlanoEnsinoContent,
  Softex: emptySoftexContent,
};

function seed() {
  for (const doc of mockDocuments) {
    store.set(doc.id, {
      ...doc,
      content: EMPTY_CONTENT_BY_TYPE[doc.type]() as DocumentContent,
    });
  }
}

seed();

const DOCUMENT_TITLE_BY_TYPE: Record<DocumentType, string> = {
  "Escopo e Proposta": "Escopo e Proposta",
  "Plano de Ensino": "Plano de Ensino",
  Softex: "Softex",
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const BACKED_TYPES: DocumentType[] = ["Escopo e Proposta", "Plano de Ensino", "Softex"];

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function hydrateSoftexContent(rawContent: Record<string, unknown>): SoftexContent {
  const empty = emptySoftexContent();
  const stored = rawContent as Partial<SoftexContent>;
  const storedMetas = new Map(
    (Array.isArray(stored.metas) ? stored.metas : []).map((meta) => [meta.id, meta])
  );

  return {
    intro: { ...empty.intro, ...(stored.intro ?? {}) },
    metas: empty.metas.map((meta) => {
      const storedMeta = storedMetas.get(meta.id);
      const storedAnswers = new Map(
        [
          ...(storedMeta?.beforeItems ?? []),
          ...(storedMeta?.afterItems ?? []),
        ].map((item) => [item.id, item.answer])
      );
      return {
        ...meta,
        beforeItems: meta.beforeItems.map((item) => ({
          ...item,
          answer: storedAnswers.get(item.id) ?? "",
        })),
        afterItems: meta.afterItems.map((item) => ({
          ...item,
          answer: storedAnswers.get(item.id) ?? "",
        })),
      };
    }),
  };
}

function hydrateDocumentContent(
  type: DocumentType,
  rawContent: Record<string, unknown>
) {
  if (type === "Softex") return hydrateSoftexContent(rawContent);
  return { ...EMPTY_CONTENT_BY_TYPE[type](), ...rawContent };
}

// A API devolve { message } em 403/409 (sem permissão, status não permite); repassa ao usuário.
function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

function fromDto<C extends object>(
  dto: TrackDocumentContentDTO,
  fallbackType: DocumentType,
  overrides: Partial<Pick<StoredDocument, "trail" | "semester" | "career">> = {}
): StoredDocument<C> {
  const resolvedType = BACKED_TYPES.includes(dto.documentType as DocumentType)
    ? (dto.documentType as DocumentType)
    : fallbackType;
  return {
    id: dto.id,
    number: "",
    title: DOCUMENT_TITLE_BY_TYPE[resolvedType],
    type: resolvedType,
    trail: overrides.trail ?? "",
    semester: overrides.semester ?? "",
    career: overrides.career ?? "",
    teachingMode: "" as unknown as StoredDocument["teachingMode"],
    status: dto.status as DocumentStatusValue,
    devolveObservation: dto.devolveObservation ?? undefined,
    content: hydrateDocumentContent(resolvedType, dto.content) as C,
  } as StoredDocument<C>;
}

// Status que cada ação produz nos documentos mock (os documentos da API usam o endpoint do backend).
const MOCK_STATUS_BY_ACTION: Record<DocumentTransitionAction, DocumentStatusValue> = {
  devolve: "Rascunho",
  close: "Concluído",
  reopen: "Em Revisão",
  archive: "Arquivado",
  restore: "Rascunho",
};

export const DocumentService = {
  async getDocument(
    id: string,
    type: DocumentType = "Escopo e Proposta"
  ): Promise<StoredDocument | null> {
    if (!BACKED_TYPES.includes(type) || !isUuid(id)) {
      await wait(400);
      const doc = store.get(id);
      if (!doc) return null;
      return { ...doc, content: { ...doc.content } };
    }

    try {
      return fromDto<DocumentContent>(await getTrackDocumentContent(id), type);
    } catch {
      return null;
    }
  },

  async updateDocument<C extends object = DocumentContent>(
    id: string,
    patch: Partial<
      Pick<StoredDocument<C>, "content" | "status" | "trail" | "semester" | "career">
    >,
    type: DocumentType = "Escopo e Proposta"
  ): Promise<StoredDocument<C> | null> {
    if (!BACKED_TYPES.includes(type) || !isUuid(id)) {
      await wait(150);
      const doc = store.get(id);
      if (!doc) return null;
      const updated = {
        ...doc,
        ...patch,
        content: { ...doc.content, ...(patch.content ?? {}) },
      } as StoredDocument<C>;
      store.set(id, updated as StoredDocument);
      return { ...updated };
    }

    if (!patch.content) return null;
    try {
      const dto =
        patch.status === "Em Revisão"
          ? await (async () => {
              await saveTrackDocumentContent(id, patch.content!);
              return submitTrackDocumentForReview(id);
            })()
          : await saveTrackDocumentContent(id, patch.content);
      return fromDto<C>(dto, type, patch);
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Não foi possível salvar o documento."), { cause: error });
    }
  },

  async transition<C extends object = DocumentContent>(
    id: string,
    action: DocumentTransitionAction,
    devolveObservation?: string,
    type: DocumentType = "Escopo e Proposta"
  ): Promise<StoredDocument<C> | null> {
    if (isUuid(id)) {
      try {
        return fromDto<C>(await transitionTrackDocument(id, action, devolveObservation), type);
      } catch (error) {
        throw new Error(apiErrorMessage(error, "Não foi possível concluir a ação no documento."), { cause: error });
      }
    }

    await wait(150);
    const doc = store.get(id);
    if (!doc) return null;
    const status = MOCK_STATUS_BY_ACTION[action];
    const updated = (
      devolveObservation === undefined
        ? { ...doc, status }
        : { ...doc, status, devolveObservation }
    ) as StoredDocument<C>;
    store.set(id, updated as StoredDocument);
    return { ...updated };
  },

  async deleteDocument(id: string): Promise<boolean> {
    await wait(150);
    return store.delete(id);
  },
};

export type { StoredDocument };
