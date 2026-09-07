import type { SoftexIntro } from "../types/document";

export const SOFTEX_INTRODUCTION_DEFAULT: SoftexIntro = {
  trailName: "",
  level: "Introdutório",
  modality: "Assíncrono",
  summary: "",
  presentialHours: "0",
  remoteHours: "24",
  totalHours: "24",
  prerequisites: "",
  mentor: "",
  firstMonitor: "",
  secondMonitor: "",
  location: "Centro Universitário Senac - Campus Santo Amaro",
  address: "Av. Eng. Eusébio Stevaux, 823 - Santo Amaro, São Paulo - SP, 04696-000",
  building: "",
  room: "",
  enrollmentForm: "",
  enrollmentStart: "",
  enrollmentEnd: "",
  vacancies: "300",
  contact: "tic@sp.senac.br",
};

export interface SoftexProgressIndicator {
  id: string;
  label: string;
  value: number;
}

export const SOFTEX_PROGRESS_INDICATORS: SoftexProgressIndicator[] = [
  { id: "Geral", label: "Geral", value: 50 },
  { id: "1.13", label: "1.13", value: 50 },
  { id: "1.14", label: "1.14", value: 50 },
  { id: "1.15", label: "1.15", value: 25 },
  { id: "1.18", label: "1.18", value: 50 },
  { id: "1.19", label: "1.19", value: 50 },
  { id: "1.20", label: "1.20", value: 50 },
  { id: "2.1", label: "2.1", value: 25 },
  { id: "2.2", label: "2.2", value: 25 },
  { id: "2.3", label: "2.3", value: 50 },
  { id: "2.4", label: "2.4", value: 50 },
  { id: "2.5", label: "2.5", value: 25 },
  { id: "2.6", label: "2.6", value: 25 },
];
