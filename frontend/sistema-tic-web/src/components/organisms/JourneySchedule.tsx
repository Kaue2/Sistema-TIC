import type { ChangeEvent } from "react";

export type ScheduleItem = {
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
  onTotalHoursChange?: (value: string) => void;
  onLocationChange?: (value: string) => void;
  bordered?: boolean;
};

export function JourneySchedule({
  title = "Jornada Total",
  totalHours,
  location,
  schedule,
  editable = false,
  onScheduleChange,
  onTotalHoursChange,
  onLocationChange,
  bordered = true,
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

  const sectionClasses = [
    "w-full",
    bordered && "max-w-88 max-h-88 rounded-2xl border border-blue-100 bg-card-background p-8",
    editable ? "px-7 py-6" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={sectionClasses}>
      <div className="flex items-center justify-center gap-2 ">
        <h2 className="text-xl font-normal text-blue-100">{title}:</h2>
        {editable && onTotalHoursChange ? (
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              value={totalHours ?? ""}
              onChange={(e) => onTotalHoursChange(e.target.value)}
              className="h-8 w-16 rounded border border-black-20 bg-card-background px-2 text-center text-xl text-black-80 outline-none transition-colors focus:border-blue-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xl text-black-80">horas</span>
          </span>
        ) : (
          totalHours && (
            <span className="text-xl text-black-80">{totalHours}</span>
          )
        )}
      </div>

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
                <div className="relative">
                  <input
                    type="time"
                    value={item.start}
                    onChange={(e) => handleTimeChange(index, "start", e)}
                    disabled={!isActive}
                    className="time-picker flex align-center justify-center relative h-6 w-full rounded-lg border px-1.5 text-center text-sm outline-none transition-colors
                      border-black-20 text-black-60
                      focus:border-blue-700
                      disabled:border-black-10 disabled:text-black-40 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              ) : (
                <span
                  className={`flex h-6 items-center justify-center rounded-lg border text-sm ${
                    isActive
                      ? "border-black-20 text-black-60"
                      : "border-black-10 text-black-40 bg-gray-100"
                  }`}
                >
                  {item.start}
                </span>
              )}

              {editable ? (
                <div className="relative">
                  <input
                    type="time"
                    value={item.end}
                    onChange={(e) => handleTimeChange(index, "end", e)}
                    disabled={!isActive}
                    className="time-picker flex align-center justify-center relative h-6 w-full rounded-lg border px-1.5 text-center text-sm outline-none transition-colors
                      border-black-20 text-black-60
                      focus:border-blue-700
                      disabled:border-black-10 disabled:text-black-40 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              ) : (
                <span
                  className={`flex h-6 items-center justify-center rounded-lg border text-sm ${
                    isActive
                      ? "border-black-20 text-black-60"
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

      {(location || (editable && onLocationChange)) && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <p className="text-xl font-normal text-blue-100">Local de Atuação:</p>
          {editable && onLocationChange ? (
            <input
              type="text"
              value={location ?? ""}
              onChange={(e) => onLocationChange(e.target.value.toUpperCase())}
              className="h-8 w-16 rounded border border-black-20 bg-card-background px-2 text-center text-xl text-black-80 uppercase outline-none transition-colors focus:border-blue-700"
            />
          ) : (
            <span className="text-xl text-black-80">{location}</span>
          )}
        </div>
      )}

      <style>{`
        .time-picker::-webkit-calendar-picker-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
    </section>
  );
}
