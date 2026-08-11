import { useState } from "react";
import type { DocumentStatusValue, DocumentType } from "../types/document";
import { DocumentService, type StoredDocument } from "../services/document/DocumentService";

type UseDocumentFormOptions<
  C extends object,
  E,
> = {
  document: StoredDocument<C> | null;
  type?: DocumentType;
  empty: () => C;
  emptyErrors: () => E;
  validate: (content: C) => E;
  hasErrors: (errors: E) => boolean;
  getCareer?: (content: C) => string;
};

export function useDocumentForm<C extends object, E>(
  {
    document,
    type,
    empty,
    emptyErrors,
    validate,
    hasErrors,
    getCareer,
  }: UseDocumentFormOptions<C, E>
) {
  const [savedDoc, setSavedDoc] = useState<StoredDocument<C> | null>(document);
  const [content, setContent] = useState<C>(() =>
    document ? structuredClone(document.content) : empty()
  );
  const [errors, setErrors] = useState<E>(() => emptyErrors());
  const [isBusy, setIsBusy] = useState(false);
  const [initialSnapshot] = useState(() => JSON.stringify(content));

  const status: DocumentStatusValue = savedDoc?.status ?? "Rascunho";
  const isDirty = JSON.stringify(content) !== initialSnapshot;

  function runValidation(): boolean {
    const next = validate(content);
    setErrors(next);
    return !hasErrors(next);
  }

  const careerPatch = getCareer
    ? { career: getCareer(content) }
    : {};

  async function createAndPersist(
    target: DocumentStatusValue
  ): Promise<StoredDocument<C> | null> {
    if (!type) return null;
    const created = await DocumentService.createDocument<C>(type);
    const updated = await DocumentService.updateDocument(created.id, {
      content,
      ...careerPatch,
      status: target,
    });
    if (!updated) return null;
    setSavedDoc(updated);
    return updated;
  }

  async function save(): Promise<StoredDocument<C> | null> {
    if (isBusy || !runValidation()) return null;
    setIsBusy(true);
    try {
      if (savedDoc) {
        const updated = await DocumentService.updateDocument(savedDoc.id, {
          content,
          ...careerPatch,
          status: "Rascunho",
        });
        if (updated) setSavedDoc(updated);
        return updated;
      }
      return await createAndPersist("Rascunho");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendToReview(): Promise<StoredDocument<C> | null> {
    if (isBusy || !runValidation()) return null;
    setIsBusy(true);
    try {
      if (savedDoc) {
        const updated = await DocumentService.updateDocument(savedDoc.id, {
          content,
          ...careerPatch,
          status: "Em Revisão",
        });
        if (updated) setSavedDoc(updated);
        return updated;
      }
      return await createAndPersist("Em Revisão");
    } finally {
      setIsBusy(false);
    }
  }

  async function transition(
    target: DocumentStatusValue,
    devolveObservation?: string
  ): Promise<StoredDocument<C> | null> {
    if (!savedDoc || isBusy) return null;
    setIsBusy(true);
    try {
      const updated = await DocumentService.transitionStatus<C>(
        savedDoc.id,
        target,
        devolveObservation
      );
      if (updated) setSavedDoc(updated);
      return updated;
    } finally {
      setIsBusy(false);
    }
  }

  const devolve = (devolveObservation?: string) =>
    transition("Rascunho", devolveObservation);
  const close = () => transition("Concluído");
  const reopen = () => transition("Em Revisão");
  const archive = () => transition("Arquivado");
  const restore = () => transition("Rascunho");

  async function remove(): Promise<boolean> {
    if (!savedDoc || isBusy) return false;
    setIsBusy(true);
    try {
      return await DocumentService.deleteDocument(savedDoc.id);
    } finally {
      setIsBusy(false);
    }
  }

  return {
    content,
    setContent,
    errors,
    status,
    isDirty,
    isBusy,
    save,
    sendToReview,
    devolve,
    close,
    reopen,
    archive,
    restore,
    remove,
  };
}
