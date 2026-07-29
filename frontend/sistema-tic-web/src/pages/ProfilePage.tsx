import { useParams } from "react-router-dom";
import { FixedNavigation } from "../components/FixedNavigation";
import { DecorativeBackground } from "../components/DecorativeBackground";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProfileContent } from "../components/ProfileContent";
import type { ScheduleItem } from "../components/JourneySchedule";

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
  location: string;
  trails?: string[];
  documents?: string[];
  groups?: string[];
}

const loggedUser: User = {
  id: "123",
  fullName: "João Silva",
  role: "Desenvolvedor Frontend",
  institutionalEmail: "joao.silva@empresa.com",
  administrativeEmail: "joao.admin@empresa.com",
  curriculumUrl: "https://lattes.cnptia.com.br/123",
  lattesUrl: "https://lattes.cnptia.com.br/123",
  journeys: [
    { day: "Segunda", start: "13:00", end: "19:00" },
    { day: "Terça", start: "13:00", end: "19:00" },
    { day: "Quarta", start: "13:00", end: "19:00" },
    { day: "Quinta", start: "13:00", end: "19:00" },
    { day: "Sexta", start: "13:00", end: "19:00" },
  ],
  location: "E166",
  trails: [
    "Dominando Algoritmos com C",
    "Dominando Algoritmos com Python"
  ],
  documents: [
    "Regulamento.pdf",
    "Guia.pdf"
  ],
  groups: [
    "UX",
    "Monitoria"
  ],
};

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const mode = id === loggedUser.id ? "self" : "user";

  const user = mode === "self" ? loggedUser : loggedUser;

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
