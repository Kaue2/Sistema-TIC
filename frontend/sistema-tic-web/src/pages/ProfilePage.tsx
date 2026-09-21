import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { DecorativeBackground } from "../components/atoms/DecorativeBackground";
import { ProfileHeader } from "../components/organisms/ProfileHeader";
import { ProfileContent } from "../components/organisms/ProfileContent";
import { Toast } from "../components/organisms/Toast";
import type { ToastType } from "../components/organisms/Toast";
import type { ScheduleItem } from "../components/organisms/JourneySchedule";
import { getUserProfile, getUserPhotoUrl, uploadUserPhoto } from "../services/user-services";
import { getCurrentUserId } from "../services/auth";
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

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const mode = id === getCurrentUserId() ? "self" : "user";
  const { userData, setUserData } = useUser();

  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;

    getUserProfile(id).then((profile) => {
      setUser({
        id: profile.id,
        fullName: profile.name,
        role: profile.roleName ?? "-",
        institutionalEmail: profile.email,
        administrativeEmail: profile.contacts.find((c) => c.isPrimary)?.contactValue,
        lattesUrl: profile.lattesUrl ?? undefined,
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
    });

    // pro próprio usuário logado a foto já vem cacheada pelo UserProvider (busca única no
    // login/reload); só buscamos aqui quando é o perfil de outra pessoa.
    if (mode === "user") {
      getUserPhotoUrl(id).then((avatarUrl) => {
        if (avatarUrl) {
          setUser((current) => (current ? { ...current, avatar: avatarUrl } : current));
        }
      });
    }
  }, [id, mode]);

  useEffect(() => {
    // depende de user?.id (não só de userData.avatarUrl) porque o fetch do perfil e o fetch
    // da foto (cacheada no contexto) terminam em momentos diferentes; sem isso, se a foto já
    // estava em cache quando este efeito rodou a 1ª vez e `user` ainda era null, a atualização
    // se perdia e não disparava de novo.
    if (mode !== "self" || !userData?.avatarUrl || !user) return;
    setUser((current) => (current ? { ...current, avatar: userData.avatarUrl ?? current.avatar } : current));
  }, [mode, userData?.avatarUrl, user?.id]);

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

  if (!user) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <FixedNavigation
        position="left"
        items={[
          { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
          { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
          { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: false },
          { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
          { id: "profile", label: "", icon: "account_circle", route: "/profile", enabled: true, visible: true, notification: false, active: false, avatar: true },
        ]}
      />

      <DecorativeBackground />

      <main className="relative mx-auto flex min-h-screen w-full max-w-300 flex-col items-center px-6 pb-16 pt-12">
        <div className="mb-14 flex flex-col items-center">
          <ProfileHeader
            user={user}
            mode={mode}
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
          onPersonalize={() => console.log("Personalizar")}
          onChangePassword={() => console.log("Alterar senha")}
          onLogout={() => console.log("Sair")}
        />
      </main>

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
