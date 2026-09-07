import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { Toast, type ToastType } from "../components/organisms/Toast";
import { FormSection } from "../components/molecules/FormSection";
import { Button } from "../components/atoms/Button";
import { DocumentService, type StoredDocument } from "../services/document/DocumentService";
import type { DocumentMode, DocumentType, PlanoEnsinoContent, SoftexContent } from "../types/document";
import { EscopoDocumentForm } from "./EscopoDocumentForm";
import { PlanoEnsinoForm } from "./PlanoEnsinoForm";
import { SoftexForm } from "./SoftexForm";

const VALID_TYPES: DocumentType[] = [
  "Escopo e Proposta",
  "Plano de Ensino",
  "Softex",
];

const NAV_ITEMS = [
  { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
  { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
  { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: true },
  { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
  { id: "profile", label: "", icon: "account_circle", route: "/profile", enabled: true, visible: true, notification: false, active: false, avatar: true },
];

export function DocumentEditorPage({ mode }: { mode: DocumentMode }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type");
  const type: DocumentType =
    typeParam && VALID_TYPES.includes(typeParam as DocumentType)
      ? (typeParam as DocumentType)
      : "Escopo e Proposta";

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  return (
    <div className="relative min-h-screen bg-background">
      <FixedNavigation position="left" items={NAV_ITEMS} />

      <main className="relative mx-auto flex min-h-screen w-full max-w-300 flex-col px-6 pb-16">
        <DocumentEditor
          key={mode === "create" ? `create:${type}` : id}
          mode={mode}
          type={type}
          onToast={(message, toastType) => setToast({ message, type: toastType })}
        />
      </main>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

type DocumentEditorProps = {
  mode: DocumentMode;
  type: DocumentType;
  onToast: (message: string, type: ToastType) => void;
};

function DocumentEditor({ mode, type, onToast }: DocumentEditorProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (mode === "create") return;
    let cancelled = false;
    DocumentService.getDocument(id!).then((doc) => {
      if (cancelled) return;
      setDocument(doc);
      setNotFound(doc === null);
    });
    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  if (mode === "create") {
    return (
      <DocumentEditorForm
        mode={mode}
        document={null}
        type={type}
        onToast={onToast}
      />
    );
  }

  if (notFound) {
    return (
      <div className="mt-40 flex flex-col items-center gap-4 text-center">
        <span className="material-symbols-outlined text-black-40" style={{ fontSize: 56 }}>
          description
        </span>
        <p className="text-xl text-black-80">Documento não encontrado.</p>
        <Button variant="outline" icon="arrow_back" onClick={() => navigate("/documents")}>
          Voltar para documentos
        </Button>
      </div>
    );
  }

  if (document === null) {
    return <EditorSkeleton />;
  }

  return (
    <DocumentEditorForm
      mode={mode}
      document={document}
      type={type}
      onToast={onToast}
    />
  );
}

type DocumentEditorFormProps = {
  mode: DocumentMode;
  document: StoredDocument | null;
  type: DocumentType;
  onToast: (message: string, type: ToastType) => void;
};

function DocumentEditorForm({
  mode,
  document,
  type,
  onToast,
}: DocumentEditorFormProps) {
  const effectiveType = document ? document.type : type;

  if (effectiveType === "Plano de Ensino") {
    return (
      <PlanoEnsinoForm
        mode={mode}
        document={
          document as unknown as StoredDocument<PlanoEnsinoContent> | null
        }
        type={effectiveType}
        onToast={onToast}
      />
    );
  }

  if (effectiveType === "Softex") {
    return (
      <SoftexForm
        mode={mode}
        document={document as unknown as StoredDocument<SoftexContent> | null}
        type={effectiveType}
        onToast={onToast}
      />
    );
  }

  return <EscopoDocumentForm mode={mode} document={document} type={effectiveType} onToast={onToast} />;
}

function EditorSkeleton() {
  return (
    <div className="pt-12">
      <div className="mb-8">
        <div className="h-5 w-32 animate-pulse rounded-lg bg-black-20" />
        <div className="mt-4 flex items-center gap-4">
          <div className="size-12 animate-pulse rounded-full bg-black-20" />
          <div className="flex-1">
            <div className="h-7 w-64 animate-pulse rounded-lg bg-black-20" />
            <div className="mt-2 h-4 w-40 animate-pulse rounded-lg bg-black-20" />
          </div>
        </div>
      </div>
      {[0, 1, 2, 3].map((i) => (
        <FormSection key={i} title="" skeleton />
      ))}
    </div>
  );
}
