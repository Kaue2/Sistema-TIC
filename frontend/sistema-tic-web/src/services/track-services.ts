import { api } from "./api";

export interface CreateTrackDTO {
  sourceTrackId: string | null;
  knowledgeAreaId: string;
  categoryId: string | null;
  title: string;
  shortDescription: string | null;
  modality: string;
  learningLevel: string | null;
  plannedProductionStartsOn: string | null;
  plannedProductionEndsOn: string | null;
  plannedTrackStartsOn: string | null;
  plannedTrackEndsOn: string | null;
  registrationStartsAt: string | null;
  registrationEndsAt: string | null;
  onlineWorkloadMinutes: number;
  inPersonWorkloadMinutes: number;
  plannedCapacity: number | null;
  targetAudience: string | null;
  prerequisites: string | null;
  attendanceRequirementPercent: number | null;
}

export interface TrackResponseDTO {
  id: string;
  code: number;
  ideaId: string | null;
  sourceTrackId: string | null;
  knowledgeAreaId: string;
  categoryId: string | null;
  title: string;
  shortDescription: string | null;
  modality: string;
  learningLevel: string | null;
  status: string;
  plannedProductionStartsOn: string | null;
  plannedProductionEndsOn: string | null;
  plannedTrackStartsOn: string | null;
  plannedTrackEndsOn: string | null;
  registrationStartsAt: string | null;
  registrationEndsAt: string | null;
  onlineWorkloadMinutes: number;
  inPersonWorkloadMinutes: number;
  totalWorkloadMinutes: number;
  plannedCapacity: number | null;
  targetAudience: string | null;
  prerequisites: string | null;
  attendanceRequirementPercent: number | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
}

export async function createTrack(dto: CreateTrackDTO): Promise<TrackResponseDTO> {
  const response = await api.post<TrackResponseDTO>("track/create-track", dto);
  return response.data;
}

export async function getTrack(id: string): Promise<TrackResponseDTO> {
  const response = await api.get<TrackResponseDTO>(`track/${id}`);
  return response.data;
}

export interface TrackMentorSummaryDTO {
  fullName: string;
  email: string;
}

export interface TrackSummaryDTO {
  id: string;
  code: number;
  title: string;
  modality: string;
  learningLevel: string | null;
  status: string;
  knowledgeAreaName: string;
  mentors: TrackMentorSummaryDTO[];
}

export async function getTracks(): Promise<TrackSummaryDTO[]> {
  const response = await api.get<TrackSummaryDTO[]>("track");
  return response.data;
}

export interface KnowledgeAreaDTO {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export async function getKnowledgeAreas(): Promise<KnowledgeAreaDTO[]> {
  const response = await api.get<KnowledgeAreaDTO[]>("track/knowledge-areas");
  return response.data;
}

export interface CreateTrackTeamMemberDTO {
  trackId: string;
  userId: string;
  responsibility: string;
  isLead: boolean;
  startsOn: string | null;
}

export interface TrackTeamMemberResponseDTO {
  id: string;
  trackId: string;
  userId: string;
  responsibility: string;
  isLead: boolean;
  startsOn: string;
  endsOn: string | null;
}

export async function createTrackTeamMember(
  dto: CreateTrackTeamMemberDTO,
): Promise<TrackTeamMemberResponseDTO> {
  const response = await api.post<TrackTeamMemberResponseDTO>(
    "track/create-track-team-member",
    dto,
  );
  return response.data;
}
