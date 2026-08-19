import { createContext, useContext } from "react";
import type { SystemNotification } from "../types/notification";

export type NotificationContextType = {
  notifications: SystemNotification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
};

export const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications deve ser usado dentro de NotificationProvider.");
  }

  return context;
}
