import type { ReactNode } from "react";

type FormCardProps = {
  children: ReactNode;
};

export function FormCard({ children }: FormCardProps) {
  return (
    <div className="rounded-2xl border border-blue-40 bg-card-background p-6">
      {children}
    </div>
  );
}
