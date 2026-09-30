import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { DecorativeBackground } from "../components/atoms/DecorativeBackground";
import { Button } from "../components/atoms/Button";
import { ProfileHeader } from "../components/organisms/ProfileHeader";
import { ProfileContent } from "../components/organisms/ProfileContent";
import { Toast } from "../components/organisms/Toast";
import { PersonalizationDialog } from "../components/organisms/PersonalizationDialog";
import type { ToastType } from "../components/organisms/Toast";
import type { ScheduleItem } from "../components/organisms/JourneySchedule";
import { getUserProfile, getUserPhotoUrl, updateProfileLinks, uploadUserPhoto } from "../services/user-services";
import { clearAuthSession, getCurrentUserId } from "../services/auth";
import { useUser } from "../contexts/userContext";

export interface User {
  id: string;
  avatar?: string;
  fullName: string;
  role: string;
  institutionalEmail: string;
  administrativeEmail?: string;
  curriculumUrl?: string;
  lattesUrl?: string;
  journeys: ScheduleItem[];
  totalHours?: string;
  location: string;
  trails?: string[];
  documents?: string[];
  groups?: string[];
}

const WEEKDAY_NAMES = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado",
];

const NAV_ITEMS = [
  { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
  { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
  { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: false },
  { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
  { id: "profile", label: "", icon: "account_circle", route: "/profile", enabled: true, visible: true, notification: false, active: false, avatar: true },
];

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8 animate-pulse">
      <div className="mx-auto max-w-300">
        <div className="flex flex-col items-center">
          <div className="size-28 rounded-full bg-black-20" />
          <div className="mt-6 h-8 w-64 rounded bg-black-20" />
          <div className="mt-3 h-6 w-40 rounded bg-black-20" />
        </div>
        <div className="mt-12 grid grid-cols-[45%_55%] gap-24 max-md:grid-cols-1">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 w-full rounded bg-black-20" />
            ))}
          </div>
          <div className="h-88 rounded-2xl bg-black-20" />
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const mode = id === getCurrentUserId() ? "self" : "user";
  const { userData, setUserData } = useUser();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userData?.roleName === "coordinator" || userData?.roleName === "administrator";

  const loadProfile = useCallback(() => {
    if (!id) return;

    setLoading(true);
    setError(false);

    // perfil e foto resolvem juntos (a foto no modo "user" vem da rede); sem isso há uma
    // corrida: se a foto termina antes do perfil, o avatar era descartado (perfil ainda null).
    const photoPromise =
      mode === "user" ? getUserPhotoUrl(id) : Promise.resolve<string | null>(null);

    Promise.all([getUserProfile(id), photoPromise])
      .then(([profile, avatarUrl]) => {
        setUser({
          id: profile.id,
          avatar: avatarUrl ?? undefined,
          fullName: profile.name,
          role: profile.roleName ?? "-",
          institutionalEmail: profile.email,
          administrativeEmail: profile.contacts.find((c) => c.isPrimary)?.contactValue,
          lattesUrl: profile.lattesUrl ?? undefined,
          curriculumUrl: profile.curriculumUrl ?? undefined,
          location: profile.workLocation ?? "-",
          totalHours: profile.weeklyWorkloadMinutes
            ? `${Math.round(profile.weeklyWorkloadMinutes / 60)} horas`
            : undefined,
          journeys: profile.availability.map((a) => ({
            day: WEEKDAY_NAMES[a.weekday],
            start: a.startsAt.slice(0, 5),
            end: a.endsAt.slice(0, 5),
          })),
        });
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, mode]);

  useEffect(() => {
    if (!id) return;

    loadProfile();

    // pro próprio usuário logado a foto vem cacheada pelo UserProvider (busca única no
    // login/reload) e é aplicada pelo efeito reativo abaixo; a foto de terceiros já veio no
    // loadProfile.
  }, [id, loadProfile]);

  useEffect(() => {
    // depende de user?.id (não só de userData.avatarUrl) porque o fetch do perfil e o fetch
    // da foto (cacheada no contexto) terminam em momentos diferentes; sem isso, se a foto já
    // estava em cache quando este efeito rodou a 1ª vez e `user` ainda era null, a atualização
    // se perdia e não disparava de novo.
    if (mode !== "self" || !userData?.avatarUrl || !user) return;
    setUser((current) => (current ? { ...current, avatar: userData.avatarUrl ?? current.avatar } : current));
  }, [mode, userData?.avatarUrl, user?.id]);

  function handleLogout() {
    clearAuthSession();
    setUserData(null);
    navigate("/", { replace: true });
  }

  function handleChangePassword() {
    navigate("/access-update");
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !id) return;

    setUploadingPhoto(true);
    try {
      await uploadUserPhoto(id, file);
      const avatarUrl = await getUserPhotoUrl(id);
      setUser((current) => (current ? { ...current, avatar: avatarUrl ?? current.avatar } : current));
      if (mode === "self" && userData) {
        setUserData({ ...userData, avatarUrl });
      }
      setToast({ message: "Foto de perfil atualizada.", type: "success" });
    } catch {
      setToast({ message: "Não foi possível enviar a foto de perfil.", type: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleEditClick() {
    if (!id) return;
    navigate(`/members/${id}/edit`);
  }

  async function handleSaveLinks(curriculumUrl: string, lattesUrl: string): Promise<boolean> {
    if (!id) return false;

    try {
      await updateProfileLinks(id, { curriculumUrl, lattesUrl });
      setUser((current) =>
        current ? { ...current, curriculumUrl, lattesUrl } : current
      );
      setToast({ message: "Informações acadêmicas atualizadas.", type: "success" });
      return true;
    } catch {
      setToast({ message: "Não foi possível salvar as informações acadêmicas.", type: "error" });
      return false;
    }
  }

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-background">
        <FixedNavigation
          position="left"
          items={NAV_ITEMS}
        />

        <main className="relative mx-auto flex min-h-screen w-full max-w-300 flex-col items-center justify-center px-6 pb-16 pt-12">
          <div className="flex max-w-md flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-5xl text-black-60">error_outline</span>
            <h1 className="text-2xl font-medium text-black-80">
              Não foi possível carregar o perfil
            </h1>
            <p className="text-sm text-black-60">
              Verifique sua conexão e tente novamente.
            </p>
            <Button variant="outline" icon="refresh" onClick={loadProfile}>
              Tentar novamente
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <FixedNavigation
        position="left"
        items={NAV_ITEMS}
      />

      <DecorativeBackground />

      <main className="relative mx-auto flex min-h-screen w-full max-w-300 flex-col items-center px-6 pb-16 pt-12">
        <div className="mb-14 flex flex-col items-center">
          <ProfileHeader
            user={user}
            mode={mode}
            canEdit={isAdmin}
            onEditClick={handleEditClick}
            onAvatarEditClick={() => {
              if (!uploadingPhoto) fileInputRef.current?.click();
            }}
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoSelected}
        />

        <ProfileContent
          user={user}
          mode={mode}
          onPersonalize={() => setPersonalizationOpen(true)}
          onChangePassword={handleChangePassword}
          onLogout={handleLogout}
          academicLinksEditingAllowed={mode === "self" || isAdmin}
          onSaveAcademicLinks={handleSaveLinks}
          onToast={(message, type) => setToast({ message, type })}
        />
      </main>

      {personalizationOpen && (
        <PersonalizationDialog onClose={() => setPersonalizationOpen(false)} />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
