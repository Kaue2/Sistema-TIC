import type { ChangeEvent } from "react";

type ScheduleItem = {
  day: string;
  start: string;
  end: string;
  active?: boolean;
};

type JourneyScheduleProps = {
  title?: string;
  totalHours?: string;
  location?: string;
  schedule: ScheduleItem[];
  editable?: boolean;
  onScheduleChange?: (schedule: ScheduleItem[]) => void;
};

export function JourneySchedule({
  title = "Jornada Total",
  totalHours,
  location,
  schedule,
  editable = false,
  onScheduleChange,
}: JourneyScheduleProps) {
  function handleTimeChange(
    index: number,
    field: "start" | "end",
    e: ChangeEvent<HTMLInputElement>
  ) {
    if (!onScheduleChange) return;

    const newSchedule = schedule.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: e.target.value };
      }
      return item;
    });

    onScheduleChange(newSchedule);
  }

  return (
    <section className="w-full rounded-2xl border border-blue-100 bg-card-background p-8">
      <h2 className="text-xl text-center font-normal text-blue-100">
        {title}:{" "}
        {totalHours && (
          <span className="text-black-80 underline decoration-black-40 underline-offset-1">
            {totalHours}
          </span>
        )}
      </h2>

      <div className="mt-8 grid grid-cols-[82px_84px_84px] items-center gap-x-4 gap-y-2">
        <span className="text-center text-base text-blue-100">Dia</span>
        <span className="text-center text-base text-blue-100">Início</span>
        <span className="text-center text-base text-blue-100">Término</span>

        {schedule.map((item, index) => {
          const isActive = item.active !== false;

          return (
            <div key={item.day} className="contents">
              <span
                className={`text-center text-base ${
                  isActive ? "text-black-80" : "text-black-40"
                }`}
              >
                {item.day}
              </span>

              {editable ? (
                <input
                  type="time"
                  value={item.start}
                  onChange={(e) => handleTimeChange(index, "start", e)}
                  disabled={!isActive}
                  className={`flex h-6 items-center justify-center rounded-lg border text-sm text-center ${
                    isActive
                      ? "border-black-20 text-black-60 underline decoration-black-40 underline-offset-1"
                      : "border-black-10 text-black-40 bg-gray-100"
                  }`}
                />
              ) : (
                <span
                  className={`flex h-6 items-center justify-center rounded-lg border text-sm ${
                    isActive
                      ? "border-black-20 text-black-60 underline decoration-black-40 underline-offset-1"
                      : "border-black-10 text-black-40 bg-gray-100"
                  }`}
                >
                  {item.start}
                </span>
              )}

              {editable ? (
                <input
                  type="time"
                  value={item.end}
                  onChange={(e) => handleTimeChange(index, "end", e)}
                  disabled={!isActive}
                  className={`flex h-6 items-center justify-center rounded-lg border text-sm text-center ${
                    isActive
                      ? "border-black-20 text-black-60 underline decoration-black-40 underline-offset-1"
                      : "border-black-10 text-black-40 bg-gray-100"
                  }`}
                />
              ) : (
                <span
                  className={`flex h-6 items-center justify-center rounded-lg border text-sm ${
                    isActive
                      ? "border-black-20 text-black-60 underline decoration-black-40 underline-offset-1"
                      : "border-black-10 text-black-40 bg-gray-100"
                  }`}
                >
                  {item.end}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {location && (
        <p className="mt-6 text-xl text-center font-normal text-blue-100">
          Local de Atuação:{" "}
          <span className="text-black-80 underline decoration-black-40 underline-offset-1">
            {location}
          </span>
        </p>
      )}
    </section>
  );
}
