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
          <section className="w-full rounded-2xl border border-blue-100 bg-card-background px-10 py-8 md:w-[336px]">
            <h2 className="text-2xl font-normal text-blue-100">
              Jornada Total:{" "}
              <span className="text-black-80 underline decoration-black-40 underline-offset-3">
                25 horas
              </span>
            </h2>

            <div className="mt-8 grid grid-cols-[82px_84px_84px] items-center gap-x-4 gap-y-2">
              <span className="text-center text-lg text-blue-100">Dia</span>
              <span className="text-center text-lg text-blue-100">Início</span>
              <span className="text-center text-lg text-blue-100">Término</span>

              {schedule.map((item) => (
                <div key={item.day} className="contents">
                  <span className="text-right text-lg text-black-80">
                    {item.day}
                  </span>
                  <TimeField value={item.start} />
                  <TimeField value={item.end} />
                </div>
              ))}
            </div>

            <p className="mt-6 text-2xl font-normal text-blue-100">
              Local de Atuação:{" "}
              <span className="text-black-80 underline decoration-black-40 underline-offset-3">
                E166
              </span>
            </p>
          </section>

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

type TimeFieldProps = {
  value: string;
};

function TimeField({ value }: TimeFieldProps) {
  return (
    <span className="flex h-6 items-center justify-center rounded-lg border border-black-20 text-base text-black-60 underline decoration-black-40 underline-offset-2">
      {value}
    </span>
  );
}
