import { useMemo, useState } from "react";
import { Button } from "../components/atoms/Button";
import { Empty } from "../components/molecules/Empty";
import { SegmentedControl } from "../components/molecules/SegmentedControl";
import { FixedNavigation } from "../components/organisms/FixedNavigation";
import { NotificationCard } from "../components/organisms/NotificationCard";
import { Toast, type ToastType } from "../components/organisms/Toast";
import { useNotifications } from "../contexts/notificationContext";

const NOTIFICATION_FILTER_OPTIONS = [
  { label: "Não visto", value: "unread", icon: "cancel" },
  { label: "Já visto", value: "read", icon: "check_circle" },
];

export function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState("unread");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const filteredNotifications = useMemo(
    () => notifications.filter((notification) => notification.isRead === (filter === "read")),
    [filter, notifications]
  );

  function handleMarkAllAsRead() {
    if (unreadCount === 0) return;

    markAllAsRead();
    setToast({ message: "Todos os avisos foram marcados como vistos.", type: "success" });
  }

  return (
    <div className="relative min-h-screen bg-background">
      <FixedNavigation
        position="left"
        items={[
          { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: true },
          { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
          { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: false },
          { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
          { id: "profile", label: "", icon: "account_circle", route: "/profile/1", enabled: true, visible: true, notification: false, active: false, avatar: true },
        ]}
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-160 flex-col px-6 pb-16 pt-[84px]">
        <h1 className="text-center text-[40px] font-normal leading-none text-blue-100 sm:text-[48px]">
          Mural de Avisos
        </h1>

        <section aria-label="Filtros de avisos" className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <SegmentedControl
            options={NOTIFICATION_FILTER_OPTIONS}
            value={filter}
            onChange={setFilter}
          />
          <Button
            variant="outline"
            icon="check_circle"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="!h-9 !px-3"
          >
            Marcar tudo como visto
          </Button>
        </section>

        <section aria-label="Lista de avisos" className="mx-auto mt-30 w-full max-w-154 space-y-8">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))
          ) : (
            <Empty
              icon="notifications_off"
              iconTinted
              title={filter === "unread" ? "Nenhum aviso não visto" : "Nenhum aviso visto"}
              description="Os novos avisos aparecerão neste mural."
            />
          )}
        </section>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
