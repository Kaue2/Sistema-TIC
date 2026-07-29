import * as XLSX from "xlsx";

const TEMPLATE_HEADERS = [
  "nome_completo",
  "posicao",
  "frente",
  "email_educacional",
  "email_administrativo",
  "jornada_segunda_inicio",
  "jornada_segunda_termino",
  "jornada_terca_inicio",
  "jornada_terca_termino",
  "jornada_quarta_inicio",
  "jornada_quarta_termino",
  "jornada_quinta_inicio",
  "jornada_quinta_termino",
  "jornada_sexta_inicio",
  "jornada_sexta_termino",
  "total_horas",
  "local_atuacao",
  "trilhas",
  "documentos",
];

const EXAMPLE_ROW = [
  "Maria Silva",
  "mentoria",
  "Front-end",
  "maria.silva@senacsp.edu.br",
  "maria.admin@sp.senac.br",
  "08:00",
  "12:00",
  "08:00",
  "12:00",
  "08:00",
  "12:00",
  "08:00",
  "12:00",
  "08:00",
  "12:00",
  "25",
  "E166",
  "UI/UX, Algoritmos em C",
  "Contrato, Manual do Membro",
];

export function downloadTemplate(): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, EXAMPLE_ROW]);

  const colWidths = TEMPLATE_HEADERS.map(() => ({ wch: 24 }));
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Membro");

  XLSX.writeFile(wb, "template_membro.xlsx");
}
