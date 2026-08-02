import type { ReactNode } from "react";

type ButtonVariant = "outline" | "green" | "primary";

type ButtonProps = {
  variant?: ButtonVariant;
  icon?: string;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  outline:
    "border-blue-100 text-blue-100 hover:bg-blue-100/10",
  green:
    "border-green-100 text-green-100 hover:bg-green-100/10",
  primary:
    "border-blue-100 bg-blue-100 text-white hover:bg-blue-60",
};

export function Button({
  variant = "outline",
  icon,
  children,
  onClick,
  type = "button",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex h-10 items-center gap-2 rounded-lg border px-4 text-sm
        transition-all duration-200
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100
        ${variantClasses[variant]}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {icon && (
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
