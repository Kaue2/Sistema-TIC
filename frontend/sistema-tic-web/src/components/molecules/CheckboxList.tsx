import type {
  CheckboxListMode,
  CheckboxListValue,
} from "../../types/document";
import { REQUISITES_OPTIONS } from "../../data/documentFields";
import { CheckboxItem } from "../atoms/CheckboxItem";
import { FormField } from "./FormField";
import { DynamicInputList } from "./DynamicInputList";

type CheckboxListProps = {
  id: string;
  title: string;
  value: CheckboxListValue;
  onChange: (value: CheckboxListValue) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function CheckboxList({
  id,
  title,
  value,
  onChange,
  placeholder = "Digite um item...",
  disabled = false,
}: CheckboxListProps) {
  function handleModeChange(mode: CheckboxListMode) {
    onChange({ mode, items: mode === "list" ? value.items : [] });
  }

  return (
    <FormField id={id} label={title}>
      <div role="group" aria-label={title} className="flex flex-col gap-2">
        {REQUISITES_OPTIONS.map((option) => (
          <CheckboxItem
            key={option.value}
            label={option.label}
            checked={value.mode === option.value}
            disabled={disabled}
            onChange={() => handleModeChange(option.value as CheckboxListMode)}
          />
        ))}
      </div>

      {value.mode === "list" && (
        <div className="mt-4">
          <DynamicInputList
            title=" "
            placeholder={placeholder}
            values={value.items}
            onChange={(items) => onChange({ mode: "list", items })}
            disabled={disabled}
          />
        </div>
      )}
    </FormField>
  );
}
