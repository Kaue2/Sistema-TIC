import type { SoftexContent, SoftexItem } from "../../types/document";

export interface SoftexErrors {
  required: string[];
}

export function collectSoftexItems(content: SoftexContent): SoftexItem[] {
  return content.metas.flatMap((meta) => [
    ...meta.beforeItems,
    ...meta.afterItems,
  ]);
}

export function validateSoftexContent(): SoftexErrors {
  return { required: [] };
}

export function validateSoftexContentRequired(
  content: SoftexContent
): SoftexErrors {
  const required: string[] = [];
  for (const item of collectSoftexItems(content)) {
    if (!item.answer.trim()) required.push(item.id);
  }
  return { required };
}

export function hasSoftexErrors(errors: SoftexErrors): boolean {
  return errors.required.length > 0;
}