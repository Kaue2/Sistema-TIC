import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import {
  AttachmentUploadWizard,
  type AttachmentUploadWizardHandle,
} from "../components/organisms/AttachmentUploadWizard";
import { FixedNavigation, type NavigationItem } from "../components/organisms/FixedNavigation";
import { Toast, type ToastType } from "../components/organisms/Toast";
import { getTrailById } from "../data/mockTrails";
import { AttachmentService } from "../services/document/AttachmentService";
import { getTracks } from "../services/track-services";
import type { Trail } from "../types/trail";
import { formatTrailCode, isUuid, trackSummaryToTrail } from "../utils/trail";

const NAV_ITEMS: NavigationItem[] = [
  { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
  { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: true },
  { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: false },
  { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
  { id: "profile", label: "", icon: "account_circle", enabled: true, visible: true, notification: false, active: false, avatar: true },
];

export function AttachmentUploadPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const mockTrail = getTrailById(id);
  const [resolvedTrail, setResolvedTrail] = useState<{
    routeId: string;
    trail: Trail | null;
  } | null>(null);
  const [resolvedDocument, setResolvedDocument] = useState<{
    routeId: string;
    documentId?: string;
  } | null>(null);
  const wizardRef = useRef<AttachmentUploadWizardHandle>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id || getTrailById(id)) return;

    let active = true;

    getTracks()
      .then((tracks) => {
        if (!active) return;
        const track = tracks.find((item) => item.id === id);
        setResolvedTrail({
          routeId: id,
          trail: track ? trackSummaryToTrail(track) : null,
        });
      })
      .catch(() => {
        if (active) setResolvedTrail({ routeId: id, trail: null });
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!isUuid(id)) return;

    let active = true;
    AttachmentService.getSoftexDocumentForTrail(id)
      .then((document) => {
        if (active) {
          setResolvedDocument({ routeId: id, documentId: document.id });
        }
      })
      .catch(() => {
        if (active) {
          setResolvedDocument({ routeId: id });
          setToast({
            message: "Não foi possível localizar o documento Softex desta trilha.",
            type: "error",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const resolvedTrailForRoute =
    resolvedTrail && resolvedTrail.routeId === id ? resolvedTrail.trail : null;
  const trail = mockTrail ?? resolvedTrailForRoute;
  const loadingTrail = Boolean(
    id && !mockTrail && resolvedTrail?.routeId !== id,
  );
  const documentId =
    resolvedDocument && resolvedDocument.routeId === id
      ? resolvedDocument.documentId
      : undefined;

  async function saveCurrentStep() {
    if (!wizardRef.current) return;
    setIsSaving(true);
    try {
      await wizardRef.current.saveCurrentStep();
    } finally {
      setIsSaving(false);
    }
  }

  if (loadingTrail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-black-60">
        Carregando trilha...
      </div>
    );
  }

  if (!trail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-black-60">
        Trilha não encontrada.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FixedNavigation position="left" items={NAV_ITEMS} />

      <main className="relative mx-auto w-full max-w-300 px-6 pb-20 pt-16 xl:px-0">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-blue-100" style={{ fontSize: 34 }}>
                business_center
              </span>
              <h1 className="text-4xl font-normal text-blue-100">
                Softex <span className="text-xl text-black-70">FM03</span>
              </h1>
            </div>
            <p className="mt-2 text-sm text-black-60 xl:ml-[50px]">
              {formatTrailCode(trail)} | {trail.title}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              icon="save"
              disabled={isSaving}
              onClick={() => void saveCurrentStep()}
              className="!h-9 !text-xs"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              variant="outline"
              icon="arrow_back"
              onClick={() => navigate(`/trails/${id}`)}
              className="!h-9 !text-xs"
            >
              Voltar à trilha
            </Button>
          </div>
        </header>

        <AttachmentUploadWizard
          ref={wizardRef}
          documentId={documentId}
          onToast={(message, type) => setToast({ message, type })}
        />
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
