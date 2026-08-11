import { DynamicListBase } from "./DynamicListBase";

type DynamicInputListProps = {
  title: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  max?: number;
};

export function DynamicInputList({
  title,
  placeholder,
  values,
  onChange,
  disabled = false,
  max,
}: DynamicInputListProps) {
  return (
    <DynamicListBase
      title={title}
      values={values}
      onChange={onChange}
      disabled={disabled}
      max={max}
      renderControl={(value, handleChange) => (
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder={placeholder}
          className={`h-12 w-full rounded-lg border border-black-20 bg-card-background px-3 text-sm text-black-80 outline-none transition-all duration-200 placeholder:text-black-40 focus:border-blue-100 ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        />
      )}
    />
  );
}
