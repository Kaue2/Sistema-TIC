import type { TrackSummaryDTO } from "../services/track-services";
import type { Trail, TrailModality, TrailStage } from "../types/trail";

const MODALITY_LABELS: Record<string, TrailModality> = {
  online: "Assíncrono",
  hybrid: "Híbrido",
};

const STATUS_TO_STAGE: Record<string, TrailStage> = {
  draft: "Pré Trilha",
  planning: "Pré Trilha",
  production: "Pré Execução",
  pre_track: "Pré Execução",
  running: "Execução Trilha",
  post_track: "Pós Trilha",
  completed: "Pós Trilha",
  cancelled: "Pós Trilha",
};

const NOT_AVAILABLE = "Não informado";

export function trackSummaryToTrail(track: TrackSummaryDTO): Trail {
  const mentors =
    track.mentors.length > 0
      ? track.mentors.map((mentor) => ({
          id: mentor.email,
          fullName: mentor.fullName,
          role: "mentor",
          email: mentor.email,
        }))
      : [{ id: "placeholder", fullName: NOT_AVAILABLE, role: "", email: "" }];

  return {
    id: track.id,
    code: String(track.code),
    legacyCode: track.legacyCode,
    title: track.title,
    icon: "route",
    career: track.knowledgeAreaName,
    mentors,
    semester: NOT_AVAILABLE,
    modality: MODALITY_LABELS[track.modality] ?? "Assíncrono",
    level: track.learningLevel ?? "",
    stage: STATUS_TO_STAGE[track.status] ?? "Pré Trilha",
    description: "",
    progress: [],
  };
}

export function formatTrailCode(trail: Pick<Trail, "code" | "legacyCode">): string {
  const currentCode = `#${trail.code}`;
  return trail.legacyCode ? `${currentCode} · legado ${trail.legacyCode}` : currentCode;
}

export function isUuid(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}
