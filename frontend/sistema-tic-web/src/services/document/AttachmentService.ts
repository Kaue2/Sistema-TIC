import { api } from "../api";
import type { AttachmentStage, CreateAnnexRequest } from "../../types/attachment";

export const AttachmentService = {
  async getSoftexDocumentForTrail(trailId: string) {
    const response = await api.get<{ id: string; status: string }>(
      `track/${trailId}/documents/softex`
    );
    return response.data;
  },

  async exportSoftexReport(documentId: string, stageCodes: string[]) {
    const response = await api.post<Blob>(
      `documents/${documentId}/attachments/export/docx`,
      { stageCodes },
      { responseType: "blob" }
    );
    return {
      content: response.data,
      fileName: "relatorio-softex.docx",
    };
  },

  async getStage(documentId: string, stageCode: string) {
    const response = await api.get<AttachmentStage>(
      `documents/${documentId}/attachments/stages/${encodeURIComponent(stageCode)}`
    );
    return response.data;
  },

  async createAnnex(documentId: string, request: CreateAnnexRequest) {
    const response = await api.post<{ id: string }>(
      `documents/${documentId}/attachments/annexes`,
      request
    );
    return response.data.id;
  },

  async uploadImages(documentId: string, annexId: string, files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    await api.post(`documents/${documentId}/attachments/annexes/${annexId}/images`, form);
  },

  async deleteAnnex(documentId: string, annexId: string) {
    await api.delete(`documents/${documentId}/attachments/annexes/${annexId}`);
  },

  async deleteImage(documentId: string, imageId: string) {
    await api.delete(`documents/${documentId}/attachments/images/${imageId}`);
  },

  async getImageObjectUrl(documentId: string, imageId: string) {
    const response = await api.get<Blob>(
      `documents/${documentId}/attachments/images/${imageId}/content`,
      { responseType: "blob" }
    );
    return URL.createObjectURL(response.data);
  },
};
