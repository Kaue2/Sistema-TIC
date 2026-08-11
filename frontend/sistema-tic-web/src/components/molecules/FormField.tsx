import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: ReactNode;
};

export function FormField({
  id,
  label,
  required = false,
  helper,
  error,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-black-80">
        {label}
        {required && <span className="text-red-100"> *</span>}
      </label>

      <div className="mt-1.5">{children}</div>

      {(helper || error) && (
        <p className={`mt-1.5 text-xs ${error ? "text-red-100" : "text-black-60"}`}>
          {error ?? helper}
        </p>
      )}
    </div>
  );
}
