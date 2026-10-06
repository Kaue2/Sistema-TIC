import {
  DOCUMENT_STATUS_CONFIG,
  type DocumentStatusValue,
} from "../../types/document";

type DocumentStatusProps = {
  status: DocumentStatusValue;
};

// Status que a API devolve e o front ainda não conhece (o tipo não garante isso em runtime)
// não podem derrubar a tela: caem num visual neutro mostrando o texto recebido.
const FALLBACK_STATUS_CONFIG = { dotClass: "bg-black-20", labelClass: "text-black-60" };

export function DocumentStatus({ status }: DocumentStatusProps) {
  const config = DOCUMENT_STATUS_CONFIG[status] ?? FALLBACK_STATUS_CONFIG;

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
