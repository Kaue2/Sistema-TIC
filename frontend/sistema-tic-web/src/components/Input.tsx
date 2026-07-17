import type { ChangeEvent, ReactNode, MouseEvent } from "react";

type InputProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  iconClickAction?: () => void;
  iconMouseDownAction?: () => void;
  iconMouseUpAction?: () => void;
  error?: boolean;
  disabled?: boolean;
};

export function Input({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder = " ",
  helperText,
  maxLength,
  icon,
  iconPosition = "left",
  iconClickAction,
  iconMouseDownAction,
  iconMouseUpAction,
  error = false,
  disabled = false,
}: InputProps) {
  const hasIcon = !!icon;
  const hasCounter = maxLength !== undefined;
  const currentLength = value.length;
  const isOverLimit = hasCounter && currentLength > maxLength!;

  const labelLeftClass = hasIcon && iconPosition === "left" ? "left-10" : "left-3";

  const inputPaddingClass = (() => {
    if (hasIcon && iconPosition === "left") return "pl-10 pr-3";
    if (hasIcon && iconPosition === "right") return "pl-3 pr-10";
    return "px-3";
  })();

  function handleIconMouseDown(e: MouseEvent) {
    e.preventDefault();
    iconMouseDownAction?.();
  }

  function handleIconMouseUp(e: MouseEvent) {
    e.preventDefault();
    iconMouseUpAction?.();
  }

  function handleIconClick(e: MouseEvent) {
    e.preventDefault();
    iconClickAction?.();
  }

  return (
    <div>
      <div className="relative">
        {hasIcon && iconPosition === "left" && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={handleIconMouseDown}
            onMouseUp={handleIconMouseUp}
            onClick={handleIconClick}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-black-60 transition-colors hover:text-blue-100 cursor-pointer"
          >
            {icon}
          </button>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={label ? " " : placeholder}
          disabled={disabled}
          className={`
            peer
            h-12
            w-full
            rounded
            border
            ${error ? "border-red-100" : "border-black-20"}
            ${inputPaddingClass}
            text-base
            outline-none
            transition-all
            duration-200
            ${error ? "focus:border-red-100" : "focus:border-blue-700"}
            ${disabled ? "bg-gray-100 cursor-not-allowed opacity-50" : ""}
          `}
        />

        {label && (
          <label
            htmlFor={id}
            className={`
              absolute
              ${labelLeftClass}
              top-1/2
              -translate-y-1/2
              bg-background
              px-1
              text-base
              ${error ? "text-red-100" : "text-black-60"}
              transition-all
              duration-200

              peer-focus:left-3
              peer-focus:-top-2
              peer-focus:translate-y-0
              peer-focus:text-xs
              ${error ? "peer-focus:text-red-100" : "peer-focus:text-blue-700"}

              peer-not-placeholder-shown:left-3
              peer-not-placeholder-shown:-top-2
              peer-not-placeholder-shown:translate-y-0
              peer-not-placeholder-shown:text-xs
            `}
          >
            {label}
          </label>
        )}

        {hasIcon && iconPosition === "right" && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={handleIconMouseDown}
            onMouseUp={handleIconMouseUp}
            onClick={handleIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black-60 transition-colors hover:text-blue-100 cursor-pointer"
          >
            {icon}
          </button>
        )}
      </div>

      {(helperText || hasCounter) && (
        <div className="flex items-start justify-between mt-0.5 gap-3">
          <span className="text-xs text-black-60">{helperText}</span>
          {hasCounter && (
            <span className={`text-xs ${isOverLimit ? "text-red-100" : "text-black-60"}`}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
