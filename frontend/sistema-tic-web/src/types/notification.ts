export type NotificationType =
  | "manual"
  | "task_assigned"
  | "task_due"
  | "document_submitted"
  | "document_reviewed"
  | "track_event";

export type NotificationTarget = {
  kind: "trail" | "document" | "task";
  icon: string;
  title: string;
  identifier?: string;
  subtitle: string;
  description?: string;
  status: string;
  statusTone: "green" | "blue" | "yellow";
  modality: string;
  semester: string;
  route: string;
};

export type SystemNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  createdAt: string;
  createdBy: string;
  isRead: boolean;
  target: NotificationTarget;
};
