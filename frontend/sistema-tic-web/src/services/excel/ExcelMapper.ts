import type { MemberSpreadsheetDTO } from "./types";
import { DAY_ORDER } from "./ExcelValidator";

const COL = {
  fullName: "nome_completo",
  position: "posicao",
  front: "frente",
  institutionalEmail: "email_educacional",
  administrativeEmail: "email_administrativo",
  totalHours: "total_horas",
  location: "local_atuacao",
  trails: "trilhas",
  documents: "documentos",
} as const;

function journeyKey(day: string, suffix: "inicio" | "termino"): string {
  return `jornada_${day.toLowerCase()}_${suffix}`;
}

function normalizeTime(val: string): string {
  if (!val) return "";
  const match = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return val;
  let h = Number(match[1]);
  const m = match[2];
  if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}

export function mapRowToDTO(row: Record<string, string>): MemberSpreadsheetDTO {
  const positionRaw = (row[COL.position] ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const trailsRaw = (row[COL.trails] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const documentsRaw = (row[COL.documents] ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const journey = DAY_ORDER.map((day) => ({
    day,
    start: normalizeTime(row[journeyKey(day, "inicio")] ?? ""),
    end: normalizeTime(row[journeyKey(day, "termino")] ?? ""),
    active: !!(row[journeyKey(day, "inicio")] || row[journeyKey(day, "termino")]),
  }));

  return {
    fullName: row[COL.fullName] ?? "",
    position: positionRaw,
    front: row[COL.front] ?? "",
    institutionalEmail: row[COL.institutionalEmail] ?? "",
    administrativeEmail: row[COL.administrativeEmail] ?? "",
    journey,
    totalHours: row[COL.totalHours] ?? "",
    location: (row[COL.location] ?? "").toUpperCase(),
    trails: trailsRaw,
    documents: documentsRaw,
  };
}
