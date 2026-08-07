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
