import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { DecorativeBackground } from "../components/atoms/DecorativeBackground";
import { ProfileHeader } from "../components/organisms/ProfileHeader";
import { ProfileContent } from "../components/organisms/ProfileContent";
import type { ScheduleItem } from "../components/organisms/JourneySchedule";
import { type CustomJwtDecode } from "../services/api";
import { getUserProfile } from "../services/user-services";

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

function getCurrentUserId(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return jwtDecode<CustomJwtDecode>(token).sub;
  } catch {
    return null;
  }
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const mode = id === getCurrentUserId() ? "self" : "user";

  const [user, setUser] = useState<User | null>(null);

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
  }, [id]);

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
          <ProfileHeader user={user} mode={mode} />
        </div>

        <ProfileContent
          user={user}
          mode={mode}
          onPersonalize={() => console.log("Personalizar")}
          onChangePassword={() => console.log("Alterar senha")}
          onLogout={() => console.log("Sair")}
        />
      </main>
    </div>
  );
}
