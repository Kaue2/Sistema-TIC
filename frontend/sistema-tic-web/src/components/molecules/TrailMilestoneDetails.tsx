import type { ReactNode } from "react";
import { Avatar } from "../atoms/Avatar";

type TrailMilestoneDetailsProps = {
  day: string;
  dateLabel: string;
  generalStage: string;
  specificStage: string;
  deadline: string;
  status: string;
  responsible: string;
};

export function TrailMilestoneDetails({
  day,
  dateLabel,
  generalStage,
  specificStage,
  deadline,
  status,
  responsible,
}: TrailMilestoneDetailsProps) {
  return (
    <div className="min-w-0">
      <div className="flex items-end gap-3 text-black-80">
        <time className="text-[64px] font-normal leading-none">{day}</time>
        <p className="pb-1 text-[32px] font-normal leading-none">{dateLabel}</p>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-2 gap-y-7 xl:grid-cols-[180px_minmax(0,1fr)]">
        <MilestoneField label="Etapa Geral">{generalStage}</MilestoneField>
        <MilestoneField label="Etapa Específica">
          {specificStage}
        </MilestoneField>
        <MilestoneField label="Prazo Limite">{deadline}</MilestoneField>
        <MilestoneField label="Situação">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-red-100" />
            {status}
          </span>
        </MilestoneField>
        <MilestoneField label="Membros Responsáveis">
          <span className="flex items-center gap-2">
            <Avatar
              fullName={responsible}
              size="sm"
              className="!size-6"
              iconSize={24}
            />
            <span className="truncate">{responsible}</span>
          </span>
        </MilestoneField>
      </dl>
    </div>
  );
}

function MilestoneField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium leading-none text-blue-100">{label}</dt>
      <dd className="mt-3 flex h-9 items-center rounded-lg border border-black-20 bg-card-background px-3 text-xs text-black-80">
        {children}
      </dd>
    </div>
  );
}
