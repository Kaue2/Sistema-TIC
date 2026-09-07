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
import { mockDocuments } from "../../data/mockDocuments";
import { SOFTEX_METAS, type SoftexItemSeed, type SoftexMetaSeed } from "../../data/softexFields";

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
  return { metas: SOFTEX_METAS.map(emptySoftexMeta) };
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

export const DocumentService = {
  async getDocument(id: string): Promise<StoredDocument | null> {
    await wait(400);
    const doc = store.get(id);
    if (!doc) return null;
    return { ...doc, content: { ...doc.content } };
  },

  async createDocument<C extends object = DocumentContent>(
    type: DocumentType
  ): Promise<StoredDocument<C>> {
    await wait(400);
    const numbers = [...store.values()].map((d) =>
      parseInt(d.number.replace("#", ""), 10)
    );
    const next = (numbers.length > 0 ? Math.max(...numbers) : 2985) + 1;
    const doc = {
      id: crypto.randomUUID(),
      number: `#${next}`,
      title: DOCUMENT_TITLE_BY_TYPE[type],
      type,
      trail: "",
      semester: "",
      career: "",
      teachingMode: "Híbrido",
      status: "Rascunho",
      content: EMPTY_CONTENT_BY_TYPE[type]() as DocumentContent,
    } as StoredDocument<C>;
    store.set(doc.id, doc as StoredDocument);
    return { ...doc };
  },

  async updateDocument<C extends object = DocumentContent>(
    id: string,
    patch: Partial<
      Pick<StoredDocument<C>, "content" | "status" | "trail" | "semester" | "career">
    >
  ): Promise<StoredDocument<C> | null> {
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
  },

  async transitionStatus<C extends object = DocumentContent>(
    id: string,
    status: DocumentStatusValue,
    devolveObservation?: string
  ): Promise<StoredDocument<C> | null> {
    await wait(150);
    const doc = store.get(id);
    if (!doc) return null;
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
