export type DocumentType =
  | "Escopo e Proposta"
  | "Plano de Ensino"
  | "Softex";

export type DocumentStatusValue =
  | "Concluído"
  | "Em Revisão"
  | "Rascunho"
  | "Arquivado";

export type TeachingMode = "Híbrido" | "Assíncrono";

export interface Document {
  id: string;
  number: string;
  title: string;
  type: DocumentType;
  trail: string;
  semester: string;
  career: string;
  teachingMode: TeachingMode;
  status: DocumentStatusValue;
}

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  "Escopo e Proposta": "assignment",
  "Plano de Ensino": "school",
  Softex: "business_center",
};

export const DOCUMENT_STATUS_CONFIG: Record<
  DocumentStatusValue,
  { dotClass: string; labelClass: string }
> = {
  "Concluído": { dotClass: "bg-green-100", labelClass: "text-black-80" },
  "Em Revisão": { dotClass: "bg-yellow-100", labelClass: "text-black-80" },
  "Rascunho": { dotClass: "bg-red-100", labelClass: "text-black-80" },
  "Arquivado": { dotClass: "bg-black-40", labelClass: "text-black-80" },
};

export type DocumentMode = "create" | "edit" | "view" | "review";

export type CheckboxListMode = "none" | "list";

export interface CheckboxListValue {
  mode: CheckboxListMode;
  items: string[];
}

export interface DateRangeValue {
  start: string;
  end: string;
}

export interface TimeRangeValue {
  start: string;
  end: string;
}

export interface PlanoEnsinoCard {
  objectives: string;
  classTheme: string;
  contentList: string;
  evaluationStrategy: string;
  resources: string;
  workloadModality: string;
}

export interface PlanoEnsinoModule {
  title: string;
  cards: PlanoEnsinoCard[];
}

export interface PlanoEnsinoContent {
  presentation: string;
  generalObjectives: string;
  basicBibliography: string;
  complementaryBibliography: string;
  trailContext: string;
  modules: PlanoEnsinoModule[];
}

export type SoftexSection = "Antes" | "Depois";

export interface SoftexItem {
  id: string;
  section: SoftexSection;
  title: string;
  guidance: string;
  example: string;
  answer: string;
}

export interface SoftexMeta {
  id: string;
  metadata: {
    description: string;
  };
  beforeItems: SoftexItem[];
  afterItems: SoftexItem[];
}

export interface SoftexIntro {
  trailName: string;
  level: string;
  modality: string;
  summary: string;
  presentialHours: string;
  remoteHours: string;
  totalHours: string;
  prerequisites: string;
  mentor: string;
  firstMonitor: string;
  secondMonitor: string;
  location: string;
  address: string;
  building: string;
  room: string;
  enrollmentForm: string;
  enrollmentStart: string;
  enrollmentEnd: string;
  vacancies: string;
  contact: string;
}

export interface SoftexContent {
  intro: SoftexIntro;
  metas: SoftexMeta[];
}

export interface DocumentContent {
  teacherName: string;
  career: string;
  greatArea: string;
  subareas: string[];
  trailNameSuggestions: string[];
  trailPresentation: string;
  executionPeriod: DateRangeValue;
  syncTime: TimeRangeValue;
  modality: string;
  targetAudience: string[];
  workload: string;
  syncMeetingDates: CheckboxListValue;
  softwareTypes: CheckboxListValue;
  suggestedVacancies: CheckboxListValue;
  equipmentTypes: CheckboxListValue;
  prerequisites: CheckboxListValue;
  enrollmentNumber: CheckboxListValue;
  participationStatementFrequency: string;
  matriculationNumber: CheckboxListValue;
  level: string;
  technicalCompetencies: string;
  nonTechnicalCompetencies: string[];
  curriculumNature: string[];
}

