import type { ReactNode } from "react";

type EmptyProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  iconTinted?: boolean;
  children?: ReactNode;
};

export function Empty({
  title = "Nenhum membro cadastrado",
  description = "Ainda não existem membros cadastrados nesta equipe.",
  actionLabel,
  onAction,
  icon = "group_off",
  iconTinted = false,
  children,
}: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {iconTinted ? (
        <span
          aria-hidden="true"
          className="flex size-28 items-center justify-center rounded-full bg-blue-100/10 text-blue-100"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 56, fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48" }}
          >
            {icon}
          </span>
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-black-40"
          style={{ fontSize: 80, fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 80" }}
        >
          {icon}
        </span>
      )}
      <h2 className="mt-6 text-2xl font-medium text-black-80">{title}</h2>
      <p className="mt-2 text-base text-black-60">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 flex h-9 items-center gap-2 rounded-lg border border-blue-100 px-4 text-sm text-blue-100 transition-colors hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
        >
          {actionLabel}
        </button>
      )}
      {children}
    </div>
  );
}
