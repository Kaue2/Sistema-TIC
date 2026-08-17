const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MARKED_DAYS = new Set([1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14, 15]);

const CALENDAR_DAYS = Array.from({ length: 42 }, (_, index) => {
  const day = index - 5;
  return day > 0 && day <= 31 ? day : null;
});

export function TrailCalendar() {
  return (
    <section className="min-h-[479px] border-b border-blue-100 px-6 pt-12 xl:h-full xl:border-b-0 xl:border-r xl:px-16 xl:pt-[74px]">
      <div className="w-full max-w-[344px]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-normal text-black-80">Agosto de 2026</p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Mês anterior"
              className="flex size-10 items-center justify-center rounded-full bg-card-background text-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                chevron_left
              </span>
            </button>
            <button
              type="button"
              aria-label="Próximo mês"
              className="flex size-10 items-center justify-center rounded-full bg-card-background text-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                chevron_right
              </span>
            </button>
          </div>
        </div>

        <div className="mt-9 grid grid-cols-7 gap-2 px-2 text-center text-xs text-black-60">
          {WEEKDAYS.map((weekday, index) => (
            <span key={`${weekday}-${index}`} className="flex h-4 items-center justify-center">
              {weekday}
            </span>
          ))}

          {CALENDAR_DAYS.map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} className="size-10" />;
            }

            const isSelected = day === 10;
            const isMarked = MARKED_DAYS.has(day);

            return (
              <span
                key={day}
                className={`flex size-10 items-center justify-center rounded-full text-xs ${
                  isSelected
                    ? "border border-yellow-100 bg-yellow-100 text-black-80"
                    : isMarked
                      ? "border border-yellow-100 text-black-80"
                      : "text-black-40"
                }`}
              >
                {day}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
