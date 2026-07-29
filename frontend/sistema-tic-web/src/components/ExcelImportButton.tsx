import { useRef, useState } from "react";
import { Button } from "./Button";

type ExcelImportButtonProps = {
  text?: string;
  onImport: (data: import("../services/excel/types").MemberSpreadsheetDTO) => void;
  onError?: (errors: string[]) => void;
};

export function ExcelImportButton({ text = "Importar Planilha", onImport, onError }: ExcelImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const { importFromFile } = await import("../services/excel/ExcelImportService");
      const result = await importFromFile(file, false);

      if (result.errors.length > 0) {
        onError?.(result.errors);
      } else if (result.data.length === 1) {
        onImport(result.data[0]);
      }
    } catch {
      onError?.(["Erro inesperado ao processar a planilha."]);
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />

      <Button
        variant="outline"
        icon="docs_add_on"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? "Importando..." : text}
      </Button>
    </>
  );
}
