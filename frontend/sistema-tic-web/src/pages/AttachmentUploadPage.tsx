import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import {
  AttachmentUploadWizard,
  type AttachmentUploadWizardHandle,
} from "../components/organisms/AttachmentUploadWizard";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { Toast, type ToastType } from "../components/organisms/Toast";
import { getTrailById, mockTrails } from "../data/mockTrails";
import { AttachmentService } from "../services/document/AttachmentService";

const NAV_ITEMS = [
  { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
  { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: true },
  { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: false },
  { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
  { id: "profile", label: "", icon: "account_circle", route: "/profile/1", enabled: true, visible: true, notification: false, active: false, avatar: true },
];

function isUuid(value?: string) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function AttachmentUploadPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const trail = getTrailById(id) ?? mockTrails[0];
  const wizardRef = useRef<AttachmentUploadWizardHandle>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [documentId, setDocumentId] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isUuid(trail.id)) return;

    let active = true;
    AttachmentService.getSoftexDocumentForTrail(trail.id)
      .then((document) => {
        if (active) setDocumentId(document.id);
      })
      .catch(() => {
        if (active) {
          setToast({
            message: "Não foi possível localizar o documento Softex desta trilha.",
            type: "error",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [trail.id]);

  async function saveCurrentStep() {
    if (!wizardRef.current) return;
    setIsSaving(true);
    try {
      await wizardRef.current.saveCurrentStep();
    } finally {
      setIsSaving(false);
    }
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
              #{trail.id} | {trail.title}
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
              onClick={() => navigate(`/trails/${trail.id}`)}
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
