import { useNavigate } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import { TrailCalendar } from "../components/molecules/TrailCalendar";
import { TrailMilestoneDetails } from "../components/molecules/TrailMilestoneDetails";
import { TrailPersonCard, type TrailPerson } from "../components/molecules/TrailPersonCard";
import { TrailProgressRing } from "../components/molecules/TrailProgressRing";
import { TrailSection } from "../components/molecules/TrailSection";
import { FixedNavigation } from "../components/organisms/FixedNavigation";

const TRAIL = {
  id: "2986",
  title: "Dominando Algoritmos com C",
  career: "Engenharia de Software",
  semester: "2026/2",
  modality: "Assíncrona / EAD",
  level: "Introdutório",
  description:
    "Aprenda lógica de programação na prática, abordando sequências, condições, repetições, listas e funções para criar soluções eficientes. A trilha prepara você para resolver problemas reais no dia a dia.",
};

const STAGES = ["Pré Trilha", "Pré Execução", "Execução Trilha", "Pós Trilha"];

const MENTORS: TrailPerson[] = [
  {
    id: "bruna-1",
    fullName: "Bruna Pagnotta Faria",
    role: "Mentoria UX/UI",
    email: "bruna.pagnottafaria@senacsp.edu.br",
  },
  {
    id: "bruna-2",
    fullName: "Bruna Pagnotta Faria",
    role: "Mentoria UX/UI",
    email: "bruna.pagnottafaria@senacsp.edu.br",
  },
];

const PROGRESS_ITEMS = [
  { label: "Geral", value: 50, featured: true },
  { label: "Escopo e Proposta", value: 50, featured: false },
  { label: "Plano de Ensino", value: 50, featured: false },
  { label: "Softex", value: 25, featured: false },
];

export function TrilhasPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <FixedNavigation
        position="left"
        items={[
          {
            id: "notifications",
            label: "Avisos",
            icon: "notifications",
            route: "/notifications",
            enabled: true,
            visible: true,
            notification: true,
            active: false,
          },
          {
            id: "trails",
            label: "Trilhas",
            icon: "route",
            route: "/trails",
            enabled: true,
            visible: true,
            notification: false,
            active: true,
          },
          {
            id: "documents",
            label: "Documentos",
            icon: "article",
            route: "/documents",
            enabled: true,
            visible: true,
            notification: false,
            active: false,
          },
          {
            id: "members",
            label: "Membros",
            icon: "group",
            route: "/members",
            enabled: true,
            visible: true,
            notification: false,
            active: false,
          },
          {
            id: "profile",
            label: "",
            icon: "account_circle",
            route: "/profile/1",
            enabled: true,
            visible: true,
            notification: false,
            active: false,
            avatar: true,
          },
        ]}
      />

      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Voltar"
        className="fixed left-[35px] top-24 z-1000 flex size-[54px] items-center justify-center rounded-full border-2 border-blue-100 bg-card-background text-blue-100 shadow-[0_4px_4px_rgba(0,0,0,0.08)] transition-colors hover:bg-blue-100 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100 xl:top-[calc(50%-299px)]"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          arrow_back_ios_new
        </span>
      </button>

      <main className="relative mx-auto w-full max-w-300 px-6 pb-32 pt-[88px] xl:px-0">
        <header className="xl:min-h-[392px]">
          <div className="flex flex-wrap items-center gap-4 xl:gap-8">
            <span
              className="material-symbols-outlined text-blue-100"
              style={{ fontSize: 36 }}
            >
              code
            </span>

            <h1 className="text-[40px] font-normal leading-[1.1] text-blue-100 xl:text-[52px]">
              {TRAIL.title}
            </h1>

            <span className="text-[20px] text-black-60">#{TRAIL.id}</span>
          </div>

          <p className="mt-2 text-xl text-black-80 xl:ml-[72px] xl:text-[28px]">
            {TRAIL.career}
          </p>

          <TrailStageStepper currentStage="Pré Trilha" />
        </header>

        <div className="space-y-[60px]">
          <div className="grid gap-8 xl:grid-cols-[648px_520px]">
            <TrailSection title="Visão Geral" className="xl:h-[412px]">
              <p className="text-sm leading-5 text-black-60">
                <strong className="font-medium text-blue-100">Sobre: </strong>
                {TRAIL.description}
              </p>

              <dl className="mt-8 space-y-3 text-sm">
                <TrailDetail label="Nível" value={TRAIL.level} />
                <TrailDetail label="Modalidade" value={TRAIL.modality} />
                <TrailDetail label="Semestre" value={TRAIL.semester} />
              </dl>
            </TrailSection>

            <aside className="space-y-4 xl:pt-[61px]">
              {MENTORS.map((mentor) => (
                <TrailPersonCard key={mentor.id} person={mentor} />
              ))}
            </aside>
          </div>

          <TrailSection
            title="Documentos Concluídos"
            className="xl:h-[421px]"
            contentClassName="!p-0"
            action={
              <Button
                variant="outline"
                icon="visibility"
                onClick={() => {
                  const params = new URLSearchParams({
                    trail: TRAIL.title,
                    trailCode: TRAIL.id,
                  });
                  navigate(`/documents?${params.toString()}`);
                }}
                className="!h-[35px] !w-[119px] !justify-center !rounded-[7.5px] !px-3 !text-xs"
              >
                Ver todos
              </Button>
            }
          >
            <div className="flex h-full items-end justify-between pb-16 pl-[70px] pr-[112px] pt-6">
              {PROGRESS_ITEMS.map((item) => (
                <TrailProgressRing
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  featured={item.featured}
                />
              ))}
            </div>
          </TrailSection>

          <TrailSection
            title="Cronograma"
            className="xl:h-[541px]"
            contentClassName="!p-0"
            action={
              <Button
                variant="outline"
                icon="edit"
                className="!h-[35px] !w-[101px] !justify-center !rounded-[7.5px] !px-3 !text-xs"
              >
                Editar
              </Button>
            }
          >
            <div className="grid h-full xl:grid-cols-[472px_minmax(0,1fr)]">
              <TrailCalendar />

              <div className="px-6 py-12 xl:px-8 xl:pt-[88px]">
                <TrailMilestoneDetails
                  day="10"
                  dateLabel="de Agosto de 2026"
                  generalStage="Pré Trilha"
                  specificStage="Produzir a trilha conforme o documento Acomp. de Entregáveis"
                  deadline="00/00/0000"
                  status="Pendente"
                  responsible="Bruna Pagnotta Faria"
                />
              </div>
            </div>
          </TrailSection>
        </div>
      </main>
    </div>
  );
}

function TrailStageStepper({ currentStage }: { currentStage: string }) {
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <ol className="mt-16 flex w-full items-center xl:mt-[136px]">
      {STAGES.map((stage, index) => {
        const isCurrent = index === currentIndex;

        return (
          <li key={stage} className="flex min-w-0 flex-1 items-center">
            <span
              className={`material-symbols-outlined shrink-0 ${
                isCurrent ? "text-blue-100" : "text-black-40"
              }`}
              style={{
                fontSize: 32,
                fontVariationSettings: `'FILL' ${isCurrent ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 32`,
              }}
            >
              check_circle
            </span>

            <span
              className={`ml-2 truncate text-xs ${
                isCurrent ? "text-black-80" : "text-black-60"
              }`}
            >
              {stage}
            </span>

            {index < STAGES.length - 1 && (
              <span className="mx-4 h-px min-w-4 flex-1 bg-black-40" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function TrailDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-medium text-blue-100">{label}:</dt>
      <dd className="text-black-60">{value}</dd>
    </div>
  );
}
