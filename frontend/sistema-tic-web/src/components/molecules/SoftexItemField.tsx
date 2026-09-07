import { Textarea } from "../atoms/Textarea";
import { SOFTEX_ANSWER_MAX_LENGTH } from "../../data/softexFields";
import type { SoftexItem } from "../../types/document";

type SoftexItemFieldProps = {
  item: SoftexItem;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
};

export function SoftexItemField({
  item,
  value,
  onChange,
  disabled = false,
  error = false,
}: SoftexItemFieldProps) {
  return (
    <div
      data-softex-id={item.id}
      className="flex flex-col gap-2 rounded-lg border border-transparent p-2 transition-colors"
    >
      <p className="text-base leading-relaxed">
        <span className="font-medium text-blue-100">{item.id}:</span>{" "}
        <span className="text-black-80">{item.title}</span>
      </p>

      {item.guidance && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-black-60">
          {item.guidance}
        </p>
      )}

      {item.example && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-black-60">
          {item.example}
        </p>
      )}

      <Textarea
        id={`softex-${item.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`}
        value={value}
        onChange={onChange}
        placeholder="Escreva a resposta..."
        maxLength={SOFTEX_ANSWER_MAX_LENGTH}
        disabled={disabled}
        error={error}
        autoGrow
      />

      {error && (
        <p className="text-xs text-red-100">Preencha este campo para enviar.</p>
      )}
    </div>
  );
}