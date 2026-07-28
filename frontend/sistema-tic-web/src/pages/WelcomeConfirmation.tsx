import { JourneySchedule } from "../components/JourneySchedule";

const schedule = [
  { day: "Segunda", start: "13:00", end: "19:00" },
  { day: "Terça", start: "13:00", end: "19:00" },
  { day: "Quarta", start: "13:00", end: "19:00" },
  { day: "Quinta", start: "13:00", end: "19:00" },
  { day: "Sexta", start: "13:00", end: "19:00" },
];

export function WelcomeConfirmation() {
  return (
    <main className="min-h-screen bg-background px-6 text-black-80">
      <section className="mx-auto flex min-h-screen w-full max-w-[820px] flex-col justify-center gap-10 py-12 md:grid md:grid-cols-[1fr_360px] md:items-center md:gap-28">
        <div className="text-center">
          <h1 className="text-[56px] leading-none font-normal text-blue-100 md:text-[64px]">
            Bem-vindo!
          </h1>
          <p className="mt-3 text-2xl leading-8 text-black-80">
            Para concluir sua entrada,
            <br />
            confirme alguns dados.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end">
          <JourneySchedule
            totalHours="25 horas"
            location="E166"
            schedule={schedule}
            editable={false}
          />

          <button
            type="button"
            className="mt-8 h-[42px] w-[152px] rounded bg-blue-100 text-base font-medium text-white uppercase shadow-md transition-colors hover:bg-blue-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
          >
            Avançar
          </button>
        </div>
      </section>
    </main>
  );
}
