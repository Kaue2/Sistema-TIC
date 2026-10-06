import { api } from "./api";
import type { NotificationListResponse } from "../types/notification";

export const notificationApi = {
  async getNotifications(): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>("notifications");
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.put(`notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put("notifications/read-all");
  },
};