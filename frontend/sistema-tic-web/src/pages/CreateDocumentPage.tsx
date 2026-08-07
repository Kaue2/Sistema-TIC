import { useSearchParams } from "react-router-dom";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { DOCUMENT_TYPE_ICONS } from "../types/document";
import type { DocumentType } from "../types/document";

const VALID_TYPES: DocumentType[] = [
  "Escopo e Proposta",
  "Plano de Ensino",
  "Softex",
];

export function CreateDocumentPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") as DocumentType | null;
  const typeIsValid = type !== null && VALID_TYPES.includes(type);

  return (
    <div className="relative min-h-screen bg-background">
      <FixedNavigation
        position="left"
        items={[
          { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
          { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
          { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: true },
          { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
          { id: "profile", label: "", icon: "account_circle", route: "/profile", enabled: true, visible: true, notification: false, active: false, avatar: true },
        ]}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-300 flex-col items-center px-6 pb-16 pt-12">
        <h1 className="flex items-center gap-3 text-[52px] font-normal leading-none text-blue-100">
          {typeIsValid && (
            <span
              aria-hidden="true"
              className="material-symbols-outlined"
              style={{ fontSize: 40 }}
            >
              {DOCUMENT_TYPE_ICONS[type]}
            </span>
          )}
          Novo documento
        </h1>
        <p className="mt-4 text-xl text-black-80">
          {typeIsValid ? type : "Selecione o tipo de documento."}
        </p>
        <p className="mt-12 text-base text-black-60">Página em construção.</p>
      </main>
    </div>
  );
}
