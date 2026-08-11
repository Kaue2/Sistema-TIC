import type { PlanoEnsinoContent } from "../../types/document";

export type PlanoEnsinoErrors = {
  presentation?: string;
  moduleTitles: (string | undefined)[];
};

export function validatePlanoEnsinoContent(
  content: PlanoEnsinoContent
): PlanoEnsinoErrors {
  const errors: PlanoEnsinoErrors = {
    presentation: content.presentation.trim()
      ? undefined
      : "Este campo é obrigatório.",
    moduleTitles: content.modules.map((module) =>
      module.title.trim() ? undefined : "Este campo é obrigatório."
    ),
  };
  return errors;
}

export function hasPlanoEnsinoErrors(errors: PlanoEnsinoErrors): boolean {
  return (
    errors.presentation !== undefined ||
    errors.moduleTitles.some((error) => error !== undefined)
  );
}
