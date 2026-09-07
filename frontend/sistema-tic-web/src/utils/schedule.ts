import type { ScheduleItem } from "../components/organisms/JourneySchedule";

export function calculateTotalHours(schedule: ScheduleItem[]): string {
  let totalMinutes = 0;

  for (const item of schedule) {
    const isActive = item.active !== false;
    if (!isActive || !item.start || !item.end) continue;

    const [startH, startM] = item.start.split(":").map(Number);
    const [endH, endM] = item.end.split(":").map(Number);
    if (startH === undefined || startM === undefined) continue;
    if (endH === undefined || endM === undefined) continue;

    let diff = endH * 60 + endM - (startH * 60 + startM);
    if (diff <= 0) diff += 24 * 60;
    totalMinutes += diff;
  }

  const total = totalMinutes / 60;
  const formatted = total.toFixed(1).replace(/\.0$/, "");
  return formatted;
}