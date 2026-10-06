import axios from "axios";
import { api } from "../api";
import type { AttachmentStage, CreateAnnexRequest, ReportStage } from "../../types/attachment";

export async function attachmentErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    let data = error.response?.data;
    if (data instanceof Blob) {
      try { data = JSON.parse(await data.text()); } catch { data = undefined; }
    }
    if (data && typeof data === "object") {
      return data.message ?? data.detail ?? data.title ?? "Não foi possível processar os anexos.";
    }
  }
  return error instanceof Error ? error.message : "Não foi possível processar os anexos.";
}

function exportFileName(header: unknown, stageCodes: string[]) {
  if (typeof header === "string") {
    const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
    const plain = /filename="([^"]+)"|filename=([^;]+)/i.exec(header);
    try {
      const name = encoded ? decodeURIComponent(encoded.trim()) : plain?.[1] ?? plain?.[2]?.trim();
      if (name) return name.split(/[\\/]/).pop()!;
    } catch { /* Fall back to the requested format for a malformed header. */ }
  }
  return new Set(stageCodes).size > 1 ? "relatorios-softex.zip" : "relatorio-softex.docx";
}

async function exportReport(url: string, body: { stageCodes: string[]; documentIds?: string[] }) {
  try {
    const response = await api.post<Blob>(url, body, { responseType: "blob" });
    return { content: response.data, fileName: exportFileName(response.headers["content-disposition"], body.stageCodes) };
  } catch (error) {
    throw new Error(await attachmentErrorMessage(error), { cause: error });
  }
}

export const AttachmentService = {
  async getReportStages() {
    const response = await api.get<ReportStage[]>("reports/softex/stages");
    return response.data;
  },
  async getSoftexDocumentForTrail(trailId: string) {
    const response = await api.get<{ id: string; status: string }>(
      `track/${trailId}/documents/softex`
    );
    return response.data;
  },

  async exportSoftexReport(documentId: string, stageCodes: string[]) {
    return exportReport(`documents/${documentId}/attachments/export/docx`, { stageCodes });
  },

  async exportSoftexReports(documentIds: string[], stageCodes: string[]) {
    return exportReport("reports/softex/export/docx", { documentIds, stageCodes });
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
