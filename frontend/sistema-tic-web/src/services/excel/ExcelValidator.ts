const ALLOWED_EXTENSIONS = [".xlsx", ".xls"];
const DAYS = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta"];

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateFileExtension(fileName: string): ValidationResult {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  const valid = ALLOWED_EXTENSIONS.includes(ext);

  return {
    valid,
    errors: valid ? [] : ["Formato de arquivo inválido. Aceito apenas .xlsx e .xls."],
  };
}

export function validateRowCount(rowCount: number): ValidationResult {
  if (rowCount === 0) {
    return { valid: false, errors: ["A planilha está vazia."] };
  }

  if (rowCount > 1) {
    return {
      valid: false,
      errors: ["A planilha deve conter apenas um membro."],
    };
  }

  return { valid: true, errors: [] };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRowData(row: Record<string, string>): ValidationResult {
  const errors: string[] = [];

  if (!row["nome_completo"]?.trim()) {
    errors.push("Nome completo é obrigatório.");
  }

  if (!row["email_educacional"]?.trim()) {
    errors.push("Email educacional é obrigatório.");
  } else if (!EMAIL_REGEX.test(row["email_educacional"])) {
    errors.push("Email educacional inválido.");
  }

  if (row["email_administrativo"]?.trim() && !EMAIL_REGEX.test(row["email_administrativo"])) {
    errors.push("Email administrativo inválido.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const DAY_ORDER = DAYS;
