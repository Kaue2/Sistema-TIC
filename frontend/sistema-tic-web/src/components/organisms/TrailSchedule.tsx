import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  getTrackTasks,
  type TrackTaskDTO,
} from "../../services/track-services";
import { isUuid } from "../../utils/trail";
import { TrailCalendar } from "../molecules/TrailCalendar";
import { TrailMilestoneDetails } from "../molecules/TrailMilestoneDetails";

const TASK_PHASE_LABELS: Record<string, string> = {
  planning: "Pré Trilha",
  production: "Pré Execução",
  pre_track: "Pré Execução",
  track: "Execução Trilha",
  post_track: "Pós Trilha",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "Pendente",
  in_progress: "Em andamento",
  blocked: "Bloqueado",
  done: "Concluído",
  cancelled: "Cancelado",
};

type TrailScheduleProps = {
  trailId?: string;
};

type TrailScheduleState = {
  trailId: string;
  tasks: TrackTaskDTO[];
  loading: boolean;
  loadError: boolean;
  selectedDate: Date | null;
  month: Date;
};

export function TrailSchedule({ trailId }: TrailScheduleProps) {
  const [scheduleState, setScheduleState] =
    useState<TrailScheduleState | null>(null);
  const hasValidTrailId = isUuid(trailId);
  const currentSchedule =
    hasValidTrailId && scheduleState?.trailId === trailId
      ? scheduleState
      : null;
  const tasks = currentSchedule?.tasks ?? [];
  const loading = hasValidTrailId && (currentSchedule?.loading ?? true);
  const loadError = currentSchedule?.loadError ?? false;
  const selectedDate = currentSchedule?.selectedDate ?? null;
  const month = currentSchedule?.month ?? firstDayOfCurrentMonth();

  useEffect(() => {
    if (!isUuid(trailId)) {
      return;
    }

    let active = true;

    getTrackTasks(trailId)
      .then((items) => {
        if (!active) return;

        const ordered = [...items].sort(compareTasks);

        const firstDatedTask = ordered.find(
          (task) => parseTaskDate(task.dueAt) !== null,
        );
        const firstDate = parseTaskDate(firstDatedTask?.dueAt ?? null);

        setScheduleState({
          trailId,
          tasks: ordered,
          loading: false,
          loadError: false,
          selectedDate: firstDate,
          month: firstDate ? firstDayOfMonth(firstDate) : firstDayOfCurrentMonth(),
        });
      })
      .catch(() => {
        if (!active) return;
        setScheduleState({
          trailId,
          tasks: [],
          loading: false,
          loadError: true,
          selectedDate: null,
          month: firstDayOfCurrentMonth(),
        });
      });

    return () => {
      active = false;
    };
  }, [trailId]);

  const markedDates = tasks
    .map((task) => parseTaskDate(task.dueAt))
    .filter((date): date is Date => date !== null);

  const selectedTask =
    selectedDate === null
      ? null
      : tasks.find((task) => {
          const dueDate = parseTaskDate(task.dueAt);
          return dueDate !== null && isSameCalendarDay(dueDate, selectedDate);
        }) ?? null;

  const selectedDeadline = parseTaskDate(selectedTask?.dueAt ?? null);

  return (
    <div className="grid h-full xl:grid-cols-[472px_minmax(0,1fr)]">
      <TrailCalendar
        month={month}
        markedDates={markedDates}
        selectedDate={selectedDate}
        onMonthChange={(nextMonth) =>
          updateScheduleState(trailId, setScheduleState, (current) => ({
            ...current,
            month: nextMonth,
          }))
        }
        onSelectDate={(nextDate) =>
          updateScheduleState(trailId, setScheduleState, (current) => ({
            ...current,
            selectedDate: nextDate,
          }))
        }
      />

      <div className="px-6 py-12 xl:px-8 xl:pt-[88px]">
        {loading ? (
          <p className="text-sm text-black-60">Carregando cronograma...</p>
        ) : loadError ? (
          <p className="text-sm text-red-100">
            Não foi possível carregar o cronograma da trilha.
          </p>
        ) : selectedTask && selectedDeadline ? (
          <TrailMilestoneDetails
            day={String(selectedDeadline.getDate()).padStart(2, "0")}
            dateLabel={`de ${formatMonthYear(selectedDeadline)}`}
            generalStage={
              TASK_PHASE_LABELS[selectedTask.phase] ?? selectedTask.phase
            }
            specificStage={selectedTask.title}
            deadline={selectedDeadline.toLocaleDateString("pt-BR")}
            status={
              TASK_STATUS_LABELS[selectedTask.status] ?? selectedTask.status
            }
            responsible={null}
          />
        ) : selectedDate ? (
          <p className="text-sm text-black-60">
            Nenhuma atividade programada para{" "}
            {selectedDate.toLocaleDateString("pt-BR")}.
          </p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-black-60">
            Nenhuma atividade cadastrada para esta trilha.
          </p>
        ) : (
          <p className="text-sm text-black-60">
            Nenhuma atividade possui prazo definido.
          </p>
        )}
      </div>
    </div>
  );
}

function firstDayOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function firstDayOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function updateScheduleState(
  trailId: string | undefined,
  setState: Dispatch<SetStateAction<TrailScheduleState | null>>,
  update: (current: TrailScheduleState) => TrailScheduleState,
) {
  if (!isUuid(trailId)) return;

  setState((current) => {
    const base =
      current?.trailId === trailId
        ? current
        : {
            trailId,
            tasks: [],
            loading: true,
            loadError: false,
            selectedDate: null,
            month: firstDayOfCurrentMonth(),
          };

    return update(base);
  });
}

function parseTaskDate(value: string | null) {
  if (!value) return null;

  const calendarDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = calendarDate
    ? new Date(
        Number(calendarDate[1]),
        Number(calendarDate[2]) - 1,
        Number(calendarDate[3]),
      )
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function compareTasks(left: TrackTaskDTO, right: TrackTaskDTO) {
  const leftDate = parseTaskDate(left.dueAt);
  const rightDate = parseTaskDate(right.dueAt);

  if (leftDate && rightDate && leftDate.getTime() !== rightDate.getTime()) {
    return leftDate.getTime() - rightDate.getTime();
  }
  if (leftDate && !rightDate) return -1;
  if (!leftDate && rightDate) return 1;

  return left.displayOrder - right.displayOrder;
}

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}
