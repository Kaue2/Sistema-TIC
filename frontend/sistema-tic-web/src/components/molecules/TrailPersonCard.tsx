import { Avatar } from "../atoms/Avatar";

export type TrailPerson = {
  id: string;
  fullName: string;
  role: string;
  email: string;
};

type TrailPersonCardProps = {
  person: TrailPerson;
};

export function TrailPersonCard({ person }: TrailPersonCardProps) {
  return (
    <article className="flex h-24 items-center gap-4 rounded-2xl border border-blue-100 bg-card-background px-4 shadow-[0_4px_4px_rgba(0,0,0,0.08)]">
      <Avatar fullName={person.fullName} size="sm" className="!size-16" />

      <div className="min-w-0">
        <h3 className="truncate text-[20px] font-normal leading-none text-black-80">
          {person.fullName}
        </h3>
        <p className="mt-2 truncate text-sm leading-none text-black-60">
          {person.role} - {person.email}
        </p>
      </div>
    </article>
  );
}
