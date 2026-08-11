import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  skeleton?: boolean;
};

export function FormSection({
  title,
  children,
  action,
  skeleton = false,
}: FormSectionProps) {
  return (
    <section>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4">
          {title && (
            <h2 className="text-2xl font-normal text-blue-100">{title}</h2>
          )}
          {action}
        </div>
      )}
      {skeleton ? (
        <div className="mt-6 flex animate-pulse flex-col gap-5">
          <div className="h-12 w-full rounded-lg bg-black-20" />
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div className="h-12 rounded-lg bg-black-20" />
            <div className="h-12 rounded-lg bg-black-20" />
          </div>
          <div className="h-12 w-full rounded-lg bg-black-20" />
        </div>
      ) : (
        <div className="mt-6">{children}</div>
      )}
    </section>
  );
}
