const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

type TrailCalendarProps = {
  month: Date;
  markedDates: Date[];
  selectedDate: Date | null;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
};

export function TrailCalendar({
  month,
  markedDates,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: TrailCalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
  const markedDays = new Set(
    markedDates
      .filter(
        (date) =>
          date.getFullYear() === year && date.getMonth() === monthIndex,
      )
      .map((date) => date.getDate()),
  );
  const monthLabel = formatMonthLabel(month);

  return (
    <section className="min-h-[479px] border-b border-blue-100 px-6 pt-12 xl:h-full xl:border-b-0 xl:border-r xl:px-16 xl:pt-[74px]">
      <div className="w-full max-w-[344px]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-normal text-black-80">{monthLabel}</p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Mês anterior"
              onClick={() =>
                onMonthChange(new Date(year, monthIndex - 1, 1))
              }
              className="flex size-10 items-center justify-center rounded-full bg-card-background text-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                chevron_left
              </span>
            </button>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() =>
                onMonthChange(new Date(year, monthIndex + 1, 1))
              }
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

          {calendarDays.map((day, index) => {
            if (!day) {
              return <span key={`empty-${index}`} className="size-10" />;
            }

            const date = new Date(year, monthIndex, day);
            const isSelected =
              selectedDate !== null &&
              selectedDate.getFullYear() === year &&
              selectedDate.getMonth() === monthIndex &&
              selectedDate.getDate() === day;
            const isMarked = markedDays.has(day);

            return (
              <button
                type="button"
                key={day}
                aria-label={date.toLocaleDateString("pt-BR")}
                aria-pressed={isSelected}
                onClick={() => onSelectDate(date)}
                className={`flex size-10 items-center justify-center rounded-full text-xs ${
                  isSelected
                    ? "border border-yellow-100 bg-yellow-100 text-black-80"
                    : isMarked
                      ? "border border-yellow-100 text-black-80"
                      : "text-black-40 hover:bg-card-background"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatMonthLabel(date: Date) {
  const label = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}
