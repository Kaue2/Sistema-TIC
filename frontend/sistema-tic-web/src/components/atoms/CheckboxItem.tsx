type CheckboxItemProps = {
  label: string;
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
  disabled?: boolean;
  labelClassName?: string;
};

export function CheckboxItem({
  label,
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  labelClassName,
}: CheckboxItemProps) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-2.5 ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-checked={indeterminate ? "mixed" : undefined}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-all duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-100 ${
          checked || indeterminate
            ? "border-blue-100 bg-blue-100"
            : "border-black-40 bg-card-background"
        }`}
      >
        {(checked || indeterminate) && (
          <span
            className="material-symbols-outlined leading-none text-white"
            style={{ fontSize: 14 }}
          >
            {indeterminate ? "remove" : "check"}
          </span>
        )}
      </span>
      <span className={`text-sm text-black-80 ${labelClassName ?? ""}`}>{label}</span>
    </label>
  );
}
