import { useParams } from "react-router-dom";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { DocumentStatus } from "../components/atoms/DocumentStatus";
import { mockDocuments } from "../data/mockDocuments";

export function DocumentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const document = mockDocuments.find((d) => d.id === id);

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
        {document ? (
          <>
            <h1 className="flex items-baseline gap-2 text-[52px] font-normal leading-none text-blue-100">
              {document.title}
              <span className="text-xl text-black-60">{document.number}</span>
            </h1>
            <p className="mt-4 text-xl text-black-80">{document.trail}</p>
            <div className="mt-3">
              <DocumentStatus status={document.status} />
            </div>
            <p className="mt-12 text-base text-black-60">
              Página em construção.
            </p>
          </>
        ) : (
          <p className="text-base text-black-60">Documento não encontrado.</p>
        )}
      </main>
    </div>
  );
}
