import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "./userContext";
import { notificationApi } from "../services/notification-services";
import { NotificationContext } from "./notificationContext";
import type { SystemNotification } from "../types/notification";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { userData } = useUser();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data.notifications);
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    if (!userData) {
      setNotifications([]);
      setLoadedForUserId(null);
      return;
    }

    if (loadedForUserId === userData.id) {
      return;
    }

    setLoadedForUserId(userData.id);
    void refresh();
  }, [userData, loadedForUserId, refresh]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      void notificationApi.markAsRead(notificationId).catch(() => void refresh());
    },
    [refresh],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true }))
    );
    void notificationApi.markAllAsRead().catch(() => void refresh());
  }, [refresh]);

  const value = useMemo(() => {
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;

    return {
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
    };
  }, [notifications, markAsRead, markAllAsRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}