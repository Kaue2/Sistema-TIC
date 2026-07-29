import * as XLSX from "xlsx";
import type { ExcelImportResult, MemberSpreadsheetDTO } from "./types";
import {
  validateFileExtension,
  validateRowCount,
  validateRowData,
} from "./ExcelValidator";
import { mapRowToDTO } from "./ExcelMapper";

export async function importFromFile(
  file: File,
  allowMultiple: boolean
): Promise<ExcelImportResult> {
  const extCheck = validateFileExtension(file.name);
  if (!extCheck.valid) {
    return { data: [], errors: extCheck.errors };
  }

  let workbook: XLSX.WorkBook;
  try {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return { data: [], errors: ["Erro ao ler o arquivo. Verifique se é uma planilha válida."] };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { data: [], errors: ["A planilha está vazia."] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false });

  const rowCountCheck = validateRowCount(rows.length);
  if (!rowCountCheck.valid && !allowMultiple) {
    return { data: [], errors: rowCountCheck.errors };
  }

  const result: ExcelImportResult = { data: [], errors: [] };

  for (const row of rows) {
    const rowCheck = validateRowData(row);
    if (!rowCheck.valid) {
      result.errors.push(...rowCheck.errors);
      continue;
    }

    const dto = mapRowToDTO(row);
    result.data.push(dto);
  }

  return result;
}

export type { ExcelImportResult, MemberSpreadsheetDTO };
