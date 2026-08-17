import type { ReactNode } from "react";

type TrailSectionProps = {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function TrailSection({
  title,
  children,
  action,
  className = "",
  contentClassName = "",
}: TrailSectionProps) {
  return (
    <section
      className={`flex w-full flex-col overflow-hidden rounded-lg border border-blue-100 bg-card-background shadow-[0_4px_4px_rgba(0,0,0,0.08)] ${className}`}
    >
      <header className="flex h-[61px] shrink-0 items-center justify-between border-b border-blue-100 px-6">
        <h2 className="text-[20px] font-normal leading-none text-black-80">
          {title}
        </h2>
        {action}
      </header>

      <div className={`min-h-0 flex-1 p-6 ${contentClassName}`}>
        {children}
      </div>
    </section>
  );
}
