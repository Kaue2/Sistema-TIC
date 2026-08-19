import { useMemo, useState } from "react";
import { mockNotifications } from "../data/mockNotifications";
import { NotificationContext } from "./notificationContext";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState(mockNotifications);

  const value = useMemo(() => {
    const unreadCount = notifications.filter((notification) => !notification.isRead).length;

    return {
      notifications,
      unreadCount,
      markAsRead: (notificationId: string) => {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
      },
      markAllAsRead: () => {
        setNotifications((current) =>
          current.map((notification) => ({ ...notification, isRead: true }))
        );
      },
    };
  }, [notifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
