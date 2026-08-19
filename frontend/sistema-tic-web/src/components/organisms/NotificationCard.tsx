import { useNavigate } from "react-router-dom";
import type { SystemNotification } from "../../types/notification";
import { Button } from "../atoms/Button";

type NotificationCardProps = {
  notification: SystemNotification;
  onMarkAsRead: (notificationId: string) => void;
};

const statusToneClasses = {
  blue: "bg-blue-100",
  green: "bg-green-100",
  yellow: "bg-yellow-100",
};

function formatNotificationDate(createdAt: string, createdBy: string) {
  const date = new Date(createdAt);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const day = new Intl.DateTimeFormat("pt-BR").format(date);

  return `Às ${time} horas, em ${day}, por ${createdBy}`;
}

export function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  const navigate = useNavigate();
  const { target } = notification;

  function markAsRead() {
    if (!notification.isRead) onMarkAsRead(notification.id);
  }

  function handleOpen() {
    markAsRead();
    navigate(target.route);
  }

  return (
    <article className="w-full overflow-hidden rounded-[18px] border border-blue-100 bg-card-background">
      <header className="px-4 pb-3 pt-4 sm:px-5">
        <h2 className="text-2xl font-normal leading-tight text-black-80">
          {notification.title}
        </h2>
        <p className="mt-1 text-sm text-black-60">
          {formatNotificationDate(notification.createdAt, notification.createdBy)}
        </p>
        {notification.message && (
          <p className="mt-3 text-base text-black-80">{notification.message}</p>
        )}
      </header>

      <div className="border-t border-blue-100 px-4 py-4 sm:px-5">
        <div className="flex gap-4">
          <span
            aria-hidden="true"
            className="material-symbols-outlined mt-1 shrink-0 text-blue-100"
            style={{ fontSize: 40, fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 40" }}
          >
            {target.icon}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-baseline gap-1.5">
              <h3 className="truncate text-xl font-normal text-blue-100">
                {target.title}
              </h3>
              {target.identifier && (
                <span className="shrink-0 text-sm text-black-60">{target.identifier}</span>
              )}
            </div>
            <p className="truncate text-sm text-black-80">{target.subtitle}</p>
            {target.description && (
              <p className="truncate text-sm text-black-60">{target.description}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center gap-2 text-black-80">
                <span className={`size-2 rounded-full ${statusToneClasses[target.statusTone]}`} />
                {target.status}
              </span>
              <span className="ml-auto text-black-60">{target.modality}</span>
              <span className="text-blue-100">{target.semester}</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-blue-100 px-4 py-3 sm:px-5">
        {!notification.isRead ? (
          <Button variant="outline" icon="check_circle" onClick={markAsRead} className="!h-9 !px-3">
            Marcar como visto
          </Button>
        ) : (
          <span className="flex items-center gap-2 text-sm text-black-60">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
            Já visto
          </span>
        )}
        <Button variant="outline" icon="folder_open" onClick={handleOpen} className="!h-9 !px-3">
          Abrir
        </Button>
      </footer>
    </article>
  );
}
