export type AttachmentQuestion = {
  id: string;
  code: string;
  label: string;
  notes?: string | null;
};

export type AttachmentImage = {
  id: string;
  originalFileName: string;
  mediaType: string;
  sizeBytes: number;
  displayOrder: number;
  caption?: string | null;
  contentUrl: string;
};

export type ReportAnnex = {
  id: string;
  title: string;
  sourceReference?: string | null;
  validationStatus: "pending" | "valid" | "inconsistent" | "rejected";
  validationNotes?: string | null;
  version: number;
  createdAt: string;
  questionCodes: string[];
  images: AttachmentImage[];
};

export type AttachmentType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  questions: AttachmentQuestion[];
  annexes: ReportAnnex[];
};

export type AttachmentStage = {
  id: string;
  code: string;
  name: string;
  isEditable: boolean;
  attachmentTypes: AttachmentType[];
};

export type CreateAnnexRequest = {
  stageCode: string;
  attachmentTypeCode: string;
  title: string;
  sourceReference?: string;
};
