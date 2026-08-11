import type {
  Document,
  DocumentContent,
  DocumentStatusValue,
  DocumentType,
} from "../../types/document";
import { mockDocuments } from "../../data/mockDocuments";

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

type StoredDocument = Document & {
  content: DocumentContent;
  devolveObservation?: string;
};

const store = new Map<string, StoredDocument>();

function seed() {
  for (const doc of mockDocuments) {
    store.set(doc.id, { ...doc, content: emptyContent() });
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

  async createDocument(type: DocumentType): Promise<StoredDocument> {
    await wait(400);
    const numbers = [...store.values()].map((d) =>
      parseInt(d.number.replace("#", ""), 10)
    );
    const next = (numbers.length > 0 ? Math.max(...numbers) : 2985) + 1;
    const doc: StoredDocument = {
      id: crypto.randomUUID(),
      number: `#${next}`,
      title: DOCUMENT_TITLE_BY_TYPE[type],
      type,
      trail: "",
      semester: "",
      career: "",
      teachingMode: "Híbrido",
      status: "Rascunho",
      content: emptyContent(),
    };
    store.set(doc.id, doc);
    return { ...doc };
  },

  async updateDocument(
    id: string,
    patch: Partial<Pick<StoredDocument, "content" | "status" | "trail" | "semester" | "career">>
  ): Promise<StoredDocument | null> {
    await wait(150);
    const doc = store.get(id);
    if (!doc) return null;
    const updated: StoredDocument = {
      ...doc,
      ...patch,
      content: { ...doc.content, ...(patch.content ?? {}) },
    };
    store.set(id, updated);
    return { ...updated };
  },

  async transitionStatus(
    id: string,
    status: DocumentStatusValue,
    devolveObservation?: string
  ): Promise<StoredDocument | null> {
    await wait(150);
    const doc = store.get(id);
    if (!doc) return null;
    const updated: StoredDocument =
      devolveObservation === undefined
        ? { ...doc, status }
        : { ...doc, status, devolveObservation };
    store.set(id, updated);
    return { ...updated };
  },

  async deleteDocument(id: string): Promise<boolean> {
    await wait(150);
    return store.delete(id);
  },
};

export type { StoredDocument };
