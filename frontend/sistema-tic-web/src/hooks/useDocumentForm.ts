import { useState } from "react";
import type {
  DocumentStatusValue,
  DocumentType,
} from "../types/document";
import {
  DocumentService,
  emptyContent,
  type StoredDocument,
} from "../services/document/DocumentService";
import {
  validateContent,
  type DocumentFieldErrors,
} from "../services/document/DocumentValidation";

type UseDocumentFormOptions = {
  document: StoredDocument | null;
  type?: DocumentType;
};

export function useDocumentForm({ document, type }: UseDocumentFormOptions) {
  const [savedDoc, setSavedDoc] = useState<StoredDocument | null>(document);
  const [content, setContent] = useState(() =>
    document ? structuredClone(document.content) : emptyContent()
  );
  const [errors, setErrors] = useState<DocumentFieldErrors>({});
  const [isBusy, setIsBusy] = useState(false);
  const [initialSnapshot] = useState(() => JSON.stringify(content));

  const status: DocumentStatusValue = savedDoc?.status ?? "Rascunho";
  const isDirty = JSON.stringify(content) !== initialSnapshot;

  function runValidation(): boolean {
    const next = validateContent(content);
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function createAndPersist(
    target: DocumentStatusValue
  ): Promise<StoredDocument | null> {
    if (!type) return null;
    const created = await DocumentService.createDocument(type);
    const updated = await DocumentService.updateDocument(created.id, {
      content,
      career: content.career,
      status: target,
    });
    if (!updated) return null;
    setSavedDoc(updated);
    return updated;
  }

  async function save(): Promise<StoredDocument | null> {
    if (isBusy || !runValidation()) return null;
    setIsBusy(true);
    try {
      if (savedDoc) {
        const updated = await DocumentService.updateDocument(savedDoc.id, {
          content,
          career: content.career,
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

  async function sendToReview(): Promise<StoredDocument | null> {
    if (isBusy || !runValidation()) return null;
    setIsBusy(true);
    try {
      if (savedDoc) {
        const updated = await DocumentService.updateDocument(savedDoc.id, {
          content,
          career: content.career,
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
  ): Promise<StoredDocument | null> {
    if (!savedDoc || isBusy) return null;
    setIsBusy(true);
    try {
      const updated = await DocumentService.transitionStatus(
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
