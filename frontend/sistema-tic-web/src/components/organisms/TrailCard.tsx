import type { Trail } from "../../types/trail";

type TrailCardProps = {
  trail: Trail;
  onOpen: (trail: Trail) => void;
  onMore: (trail: Trail) => void;
};

function getStageColor(stage: Trail["stage"]): string {
  return stage === "Pré Trilha" ? "bg-yellow-100" : "bg-blue-100";
}

export function TrailCard({ trail, onOpen, onMore }: TrailCardProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(trail);
    }
  }

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`Abrir trilha ${trail.title} #${trail.id}`}
      onClick={() => onOpen(trail)}
      onKeyDown={handleKeyDown}
      className="relative flex h-40 cursor-pointer items-start gap-4 rounded-2xl border border-blue-100 bg-card-background px-6 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-100/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
    >
      <span
        aria-hidden="true"
        className="material-symbols-outlined mt-1 shrink-0 text-blue-100"
        style={{
          fontSize: 48,
          fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48",
        }}
      >
        {trail.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline gap-2 pr-8">
          <h2 className="truncate text-xl font-normal leading-none text-blue-100">
            {trail.title}
          </h2>
          <span className="shrink-0 text-sm text-black-60">#{trail.id}</span>
        </div>
        <p className="mt-2 truncate text-sm leading-none text-black-80">
          {trail.career}
        </p>
        <p className="mt-2 truncate text-sm leading-none text-black-60">
          {trail.mentors[0]?.fullName}
        </p>
      </div>

      <div className="absolute bottom-4 left-6 right-6 flex items-center gap-2 text-sm">
        <span className="flex items-center gap-2 text-black-80">
          <span className={`size-2 rounded-full ${getStageColor(trail.stage)}`} />
          {trail.stage}
        </span>
        <span className="ml-auto text-black-60">{trail.modality}</span>
        <span className="text-blue-100">{trail.semester}</span>
      </div>

      <button
        type="button"
        aria-label={`Mais ações para ${trail.title}`}
        onClick={(event) => {
          event.stopPropagation();
          onMore(trail);
        }}
        onKeyDown={(event) => event.stopPropagation()}
        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full text-black-40 transition-colors hover:bg-blue-100 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          more_horiz
        </span>
      </button>
    </article>
  );
}
