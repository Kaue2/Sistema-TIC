export type TrailModality = "Híbrido" | "Assíncrono";

export type TrailStage =
  | "Pré Trilha"
  | "Pré Execução"
  | "Execução Trilha"
  | "Pós Trilha";

export type TrailMentor = {
  id: string;
  fullName: string;
  role: string;
  email: string;
};

export type TrailProgress = {
  label: string;
  value: number;
  featured?: boolean;
};

export type Trail = {
  id: string;
  title: string;
  icon: string;
  career: string;
  mentors: TrailMentor[];
  semester: string;
  modality: TrailModality;
  level: string;
  stage: TrailStage;
  description: string;
  progress: TrailProgress[];
};
