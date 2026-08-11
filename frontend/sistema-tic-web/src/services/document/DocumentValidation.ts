import type { DocumentContent } from "../../types/document";

export type DocumentFieldErrors<C extends object = DocumentContent> = Partial<
  Record<keyof C, string>
>;

const REQUIRED_FIELDS: (keyof DocumentContent)[] = ["teacherName"];

export const DOCUMENT_MAX_LENGTHS: Partial<
  Record<keyof DocumentContent, number>
> = {
  trailPresentation: 300,
  participationStatementFrequency: 110,
  technicalCompetencies: 110,
};

export function validateField(
  field: keyof DocumentContent,
  content: DocumentContent
): string | undefined {
  if (REQUIRED_FIELDS.includes(field)) {
    const value = content[field];
    if (typeof value === "string" && !value.trim()) {
      return "Este campo é obrigatório.";
    }
  }
  return undefined;
}

export function validateContent(
  content: DocumentContent
): DocumentFieldErrors {
  const errors: DocumentFieldErrors = {};
  for (const field of REQUIRED_FIELDS) {
    const error = validateField(field, content);
    if (error) errors[field] = error;
  }
  return errors;
}
