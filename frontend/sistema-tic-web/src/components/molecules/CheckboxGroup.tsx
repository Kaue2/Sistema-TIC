import { CheckboxItem } from "../atoms/CheckboxItem";
import { FormField } from "./FormField";

export type CheckboxOption = {
  label: string;
  value: string;
  group?: string;
};

type CheckboxGroupProps = {
  id: string;
  title: string;
  options: CheckboxOption[];
  selectionMode: "single" | "multiple";
  value: string | string[];
  onChange: (value: string | string[]) => void;
  required?: boolean;
  helper?: string;
  error?: string;
  disabled?: boolean;
  contentClassName?: string;
};

export function CheckboxGroup({
  id,
  title,
  options,
  selectionMode,
  value,
  onChange,
  required = false,
  helper,
  error,
  disabled = false,
  contentClassName = "",
}: CheckboxGroupProps) {
  const selected = selectionMode === "single"
    ? (value ? [value as string] : [])
    : (value as string[]);

  function handleToggle(optionValue: string) {
    if (selectionMode === "single") {
      onChange(selected.includes(optionValue) ? "" : optionValue);
      return;
    }
    const next = selected.includes(optionValue)
      ? selected.filter((v) => v !== optionValue)
      : [...selected, optionValue];
    onChange(next);
  }

  function handleGroupToggle(groupOptions: CheckboxOption[], allSelected: boolean) {
    const groupValues = groupOptions.map((o) => o.value);
    if (allSelected) {
      onChange(selected.filter((v) => !groupValues.includes(v)));
      return;
    }
    onChange([...selected, ...groupValues.filter((v) => !selected.includes(v))]);
  }

  function renderGroup(option: CheckboxOption, index: number) {
    const groupOptions: CheckboxOption[] = [];
    for (let i = index; i < options.length && options[i].group === option.group; i++) {
      groupOptions.push(options[i]);
    }
    const selectedCount = groupOptions.filter((o) => selected.includes(o.value)).length;
    const allSelected = selectedCount === groupOptions.length;
    const someSelected = selectedCount > 0 && !allSelected;

    return (
      <div key={option.group ?? option.value} className="flex flex-col gap-2">
        <CheckboxItem
          label={option.group ?? ""}
          checked={allSelected}
          indeterminate={someSelected}
          disabled={disabled}
          labelClassName="font-medium"
          onChange={() => handleGroupToggle(groupOptions, allSelected)}
        />
        <div className="flex flex-col gap-2 pl-6">
          {groupOptions.map((groupOption) => (
            <CheckboxItem
              key={groupOption.value}
              label={groupOption.label}
              checked={selected.includes(groupOption.value)}
              disabled={disabled}
              onChange={() => handleToggle(groupOption.value)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <FormField
      id={id}
      label={title}
      required={required}
      helper={helper}
      error={error}
    >
      <div
        role="group"
        aria-label={title}
        className={`flex flex-col gap-2 ${contentClassName}`}
      >
        {options.map((option, index) => {
          const isGroupMember = Boolean(option.group) && selectionMode === "multiple";
          if (isGroupMember) {
            const isGroupStart =
              index === 0 || options[index - 1]?.group !== option.group;
            return isGroupStart ? renderGroup(option, index) : null;
          }

          return (
            <CheckboxItem
              key={option.value}
              label={option.label}
              checked={selected.includes(option.value)}
              disabled={disabled}
              onChange={() => handleToggle(option.value)}
            />
          );
        })}
      </div>
    </FormField>
  );
}
