import type { ScheduleItem } from "../../components/JourneySchedule";

export interface MemberSpreadsheetDTO {
  fullName: string;
  position: string[];
  front: string;
  institutionalEmail: string;
  administrativeEmail: string;
  journey: ScheduleItem[];
  totalHours: string;
  location: string;
  trails: string[];
  documents: string[];
}

export interface ExcelImportResult {
  data: MemberSpreadsheetDTO[];
  errors: string[];
}
