import { api } from "./api";

export interface TrackDocumentSummaryDTO {
  id: string;
  documentType: string;
  trackTitle: string;
  knowledgeAreaName: string;
  status: string;
}

export interface DocumentosTrilhaDTO {
  escopoPropostaDaTrilha: TrackDocumentSummaryDTO | null;
  planoEnsinoDaTrilha: TrackDocumentSummaryDTO | null;
}

export async function getAllTrackDocuments(): Promise<DocumentosTrilhaDTO[]> {
  const response = await api.get<DocumentosTrilhaDTO[]>("track/documents");
  return response.data;
}

export interface TrackDocumentContentDTO {
  id: string;
  documentType: string;
  status: string;
  content: Record<string, unknown>;
}

export async function getTrackDocumentContent(id: string): Promise<TrackDocumentContentDTO> {
  const response = await api.get<TrackDocumentContentDTO>(`track-documents/${id}`);
  return response.data;
}

export async function saveTrackDocumentContent(
  id: string,
  content: object,
): Promise<TrackDocumentContentDTO> {
  const response = await api.put<TrackDocumentContentDTO>(`track-documents/${id}`, content);
  return response.data;
}
