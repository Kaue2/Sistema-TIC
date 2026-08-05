import {
  DOCUMENT_STATUS_CONFIG,
  type DocumentStatusValue,
} from "../../types/document";

type DocumentStatusProps = {
  status: DocumentStatusValue;
};

export function DocumentStatus({ status }: DocumentStatusProps) {
  const config = DOCUMENT_STATUS_CONFIG[status];

  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${config.dotClass}`}
      />
      <span className={`text-sm ${config.labelClass}`}>{status}</span>
    </span>
  );
}
