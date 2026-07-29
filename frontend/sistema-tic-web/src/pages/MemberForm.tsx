import { useState, useEffect, useCallback } from "react";
import { useParams, useBlocker } from "react-router-dom";
import { FixedNavigation } from "../components/FixedNavigation";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { JourneySchedule } from "../components/JourneySchedule";
import { DynamicInputList } from "../components/DynamicInputList";
import { Button } from "../components/Button";

import { ExcelImportButton } from "../components/ExcelImportButton";
import { Toast } from "../components/Toast";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { ToastType } from "../components/Toast";
import type { ScheduleItem } from "../components/JourneySchedule";
import type { MemberSpreadsheetDTO } from "../services/excel/types";
import { downloadTemplate } from "../services/excel/ExcelTemplateService";

const POSITION_OPTIONS = [
  { label: "Coordenação", value: "coordenação" },
  { label: "Administração", value: "administração" },
  { label: "Mentoria", value: "mentoria" },
  { label: "Monitoria", value: "monitoria" },
];

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { day: "Segunda", start: "", end: "" },
  { day: "Terça", start: "", end: "" },
  { day: "Quarta", start: "", end: "" },
  { day: "Quinta", start: "", end: "" },
  { day: "Sexta", start: "", end: "" },
];

function Skeleton() {
  return (
    <div className="min-h-screen bg-background p-8 animate-pulse">
      <div className="mx-auto max-w-300">
        <div className="h-14 w-80 rounded bg-black-20" />
        <div className="mt-8 flex gap-3">
          <div className="h-10 w-40 rounded-lg bg-black-20" />
          <div className="h-10 w-44 rounded-lg bg-black-20" />
          <div className="h-10 w-32 rounded-lg bg-black-20" />
        </div>
        <div className="mt-12 grid grid-cols-[1fr_352px] gap-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full rounded bg-black-20" />
            ))}
          </div>
          <div className="h-88 w-88 rounded-2xl bg-black-20" />
        </div>
      </div>
    </div>
  );
}

export function MemberForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(() => isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [front, setFront] = useState("");
  const [educationalEmail, setEducationalEmail] = useState("");
  const [administrativeEmail, setAdministrativeEmail] = useState("");
  const [schedule, setSchedule] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [totalHours, setTotalHours] = useState("");
  const [location, setLocation] = useState("");
  const [trails, setTrails] = useState<string[]>([""]);
  const [documents, setDocuments] = useState<string[]>([""]);

  const [emailError, setEmailError] = useState(false);
  const [adminEmailError, setAdminEmailError] = useState(false);
  const [nameError, setNameError] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname
  );

  function handleConfirmLeave() {
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  }

  function handleCancelLeave() {
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }

  useEffect(() => {
    if (!isEdit) return;

    const timer = setTimeout(() => {
      setFullName("Ana Beatriz Costa");
      setPosition("coordenação");
      setFront("UX/UI");
      setEducationalEmail("ana.costa@senacsp.edu.br");
      setAdministrativeEmail("ana.admin@sp.senac.br");
      setSchedule([
        { day: "Segunda", start: "08:00", end: "12:00" },
        { day: "Terça", start: "08:00", end: "12:00" },
        { day: "Quarta", start: "08:00", end: "12:00" },
        { day: "Quinta", start: "08:00", end: "12:00" },
        { day: "Sexta", start: "08:00", end: "12:00" },
      ]);
      setTotalHours("20");
      setLocation("E166");
      setTrails(["UI/UX", "Algoritmos em C"]);
      setDocuments(["Manual do Membro", "Contrato"]);
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [isEdit]);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateEmail(email: string): boolean {
    if (!email.trim()) return false;
    return EMAIL_REGEX.test(email);
  }

  function handleEducationalEmailChange(value: string) {
    setEducationalEmail(value);
    if (value.trim() && !validateEmail(value)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
    setDirty(true);
  }

  function handleAdminEmailChange(value: string) {
    setAdministrativeEmail(value);
    if (value.trim() && !validateEmail(value)) {
      setAdminEmailError(true);
    } else {
      setAdminEmailError(false);
    }
    setDirty(true);
  }

  function handleFullNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value.length <= 150) {
      setFullName(value);
      setNameError(false);
      setDirty(true);
    }
  }

  const handleImport = useCallback((data: MemberSpreadsheetDTO) => {
    setFullName(data.fullName);
    setPosition(data.position[0] ?? "");
    setFront(data.front);
    setEducationalEmail(data.institutionalEmail);
    setAdministrativeEmail(data.administrativeEmail);
    setSchedule(data.journey);
    setTotalHours(data.totalHours);
    setLocation(data.location);
    setTrails(data.trails.length > 0 ? data.trails : [""]);
    setDocuments(data.documents.length > 0 ? data.documents : [""]);
    setDirty(true);
  }, []);

  const handleImportError = useCallback((errors: string[]) => {
    setToast({ message: errors.join(" "), type: "error" });
  }, []);

  function handleSave() {
    let hasError = false;

    if (!fullName.trim()) {
      setNameError(true);
      hasError = true;
    }

    if (educationalEmail.trim() && !validateEmail(educationalEmail)) {
      setEmailError(true);
      hasError = true;
    }

    if (administrativeEmail.trim() && !validateEmail(administrativeEmail)) {
      setAdminEmailError(true);
      hasError = true;
    }

    if (hasError) return;

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setDirty(false);
      setToast({ message: "Membro salvo com sucesso.", type: "success" });
    }, 800);
  }

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  if (loading) return <Skeleton />;

  return (
    <div className="relative min-h-screen bg-background">
      <FixedNavigation
        position="left"
        items={[
          { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
          { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
          { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: false },
          { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: true },
          { id: "profile", label: "", icon: "account_circle", route: "/profile", enabled: true, visible: true, notification: false, active: false, avatar: true },
        ]}
      />

      <main className="relative mx-auto flex min-h-screen max-w-300 flex-col px-6 pb-16 pt-12">
        <h1 className="text-[56px] font-normal leading-none text-blue-100">
          Gerenciamento do Membro
        </h1>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            icon="description"
            onClick={downloadTemplate}
          >
            Modelo de Planilha
          </Button>
          <ExcelImportButton text="Completar dados com Planilha" onImport={handleImport} onError={handleImportError} />
          <Button
            variant="green"
            icon="save"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar"}
          </Button>
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-normal text-blue-100">
            Dados Individuais
          </h2>

          <div className="mt-6 grid grid-cols-[1fr_352px] gap-6 max-lg:grid-cols-1">
            <div className="flex flex-col gap-5">
              <Input
                id="fullName"
                label="Nome Completo"
                value={fullName}
                onChange={handleFullNameChange}
                error={nameError}
                helperText={nameError ? "Nome completo é obrigatório." : undefined}
              />

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <Select
                  id="position"
                  label="Posição"
                  value={position}
                  options={POSITION_OPTIONS}
                  onChange={(v) => { setPosition(v); setDirty(true); }}
                  placeholder="Selecione uma posição"
                />

                <Input
                  id="front"
                  label="Frente"
                  value={front}
                  onChange={(e) => { setFront(e.target.value); setDirty(true); }}
                />
              </div>

              <Input
                id="educationalEmail"
                label="Email Educacional"
                type="email"
                value={educationalEmail}
                onChange={(e) => handleEducationalEmailChange(e.target.value)}
                error={emailError}
                helperText={emailError ? "Email educacional inválido." : undefined}
              />

              <Input
                id="administrativeEmail"
                label="Email Administrativo"
                type="email"
                value={administrativeEmail}
                onChange={(e) => handleAdminEmailChange(e.target.value)}
                error={adminEmailError}
                helperText={adminEmailError ? "Email administrativo inválido." : undefined}
              />
            </div>

            <JourneySchedule
              schedule={schedule}
              editable
              totalHours={totalHours}
              location={location}
              onScheduleChange={(s) => { setSchedule(s); setDirty(true); }}
              onTotalHoursChange={(v) => { setTotalHours(v); setDirty(true); }}
              onLocationChange={(v) => { setLocation(v); setDirty(true); }}
            />
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-normal text-blue-100">
            Acessos e Vínculos
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-8 max-md:grid-cols-1">
            <DynamicInputList
              title="Trilhas"
              placeholder="Digite o nome da trilha"
              values={trails}
              onChange={(v) => { setTrails(v); setDirty(true); }}
            />

            <DynamicInputList
              title="Documentos"
              placeholder="Digite o nome do documento"
              values={documents}
              onChange={(v) => { setDocuments(v); setDirty(true); }}
            />
          </div>
        </section>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Alterações não salvas"
        message="Você tem alterações não salvas. Deseja realmente sair?"
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
      />
    </div>
  );
}
