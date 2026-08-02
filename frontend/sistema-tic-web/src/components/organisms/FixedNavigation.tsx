import { useNavigate } from "react-router-dom";

type NavigationPosition = "left" | "right" | "top" | "bottom";

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  enabled: boolean;
  visible: boolean;
  notification: boolean;
  active: boolean;
  avatar?: boolean;
  avatarUrl?: string;
}

interface FixedNavigationProps {
  position: NavigationPosition;
  items: NavigationItem[];
  onNavigate?: (route: string) => void;
}

function getPositionClasses(position: NavigationPosition): string {
  switch (position) {
    case "left":
      return "fixed left-6 top-1/2 -translate-y-1/2";
    case "right":
      return "fixed right-6 top-1/2 -translate-y-1/2";
    case "top":
      return "fixed top-6 left-1/2 -translate-x-1/2";
    case "bottom":
      return "fixed bottom-6 left-1/2 -translate-x-1/2";
  }
}

function isVertical(position: NavigationPosition): boolean {
  return position === "left" || position === "right";
}

function reorderItems(items: NavigationItem[], vertical: boolean): NavigationItem[] {
  const avatarItems = items.filter((item) => item.avatar);
  const nonAvatarItems = items.filter((item) => !item.avatar);

  if (vertical) {
    return [...nonAvatarItems, ...avatarItems];
  }
  return [...avatarItems, ...nonAvatarItems];
}

function MaterialIcon({ name, active }: { name: string; active?: boolean }) {
  return (
    <span
      className="material-symbols-outlined text-[48px] text-blue-100"
      style={{
        fontSize: "48px",
        fontVariationSettings: `'FILL' ${active ? 1 : 0}, 'wght' 300, 'GRAD' 0, 'opsz' 48`,
      }}
    >
      {name}
    </span>
  );
}

{/* <FixedNavigation
        position="left"
        items={[
          { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
          { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
          { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: false },
          { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
          { id: "profile", label: "", icon: "account_circle", route: "/profile", enabled: true, visible: true, notification: false, active: false, avatar: true }, 
        ]}
      /> */}

/**
 * Exemplo de como usar o componente FixedNavigation:
 * 
 * <FixedNavigation
 *   position="left"
 *   items={[
 *     { id: "notifications", label: "Avisos", icon: "notifications", route: "/notifications", enabled: true, visible: true, notification: true, active: false },
 *     { id: "trails", label: "Trilhas", icon: "route", route: "/trails", enabled: true, visible: true, notification: false, active: false },
 *     { id: "documents", label: "Documentos", icon: "article", route: "/documents", enabled: true, visible: true, notification: false, active: false },
 *     { id: "members", label: "Membros", icon: "group", route: "/members", enabled: true, visible: true, notification: false, active: false },
 *     { id: "profile", label: "", icon: "account_circle", route: "/profile", enabled: true, visible: true, notification: false, active: false, avatar: true }, 
 *   ]}
 * />
 */
export function FixedNavigation({ position, items, onNavigate }: FixedNavigationProps) {
  const navigate = useNavigate();
  const vertical = isVertical(position);
  const visibleItems = items.filter((item) => item.visible);
  const orderedItems = reorderItems(visibleItems, vertical);

  function handleNavigate(route: string) {
    if (onNavigate) {
      onNavigate(route);
    } else {
      navigate(route);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, route: string, enabled: boolean) {
    if (!enabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigate(route);
    }
  }

  return (
    <nav
      className={`
        fixed z-1000
        flex ${vertical ? "flex-col" : "flex-row"}
        items-center
        rounded-full
        border-2 border-blue-100
        bg-card-background
        p-3
        gap-3
        ${getPositionClasses(position)}
      `}
      role="navigation"
      aria-label="Navegação principal"
    >
      {orderedItems.map((item) => (
        <NavigationItemRenderer
          key={item.id}
          item={item}
          onNavigate={handleNavigate}
          onKeyDown={handleKeyDown}
        />
      ))}
    </nav>
  );
}

interface NavigationItemRendererProps {
  item: NavigationItem;
  onNavigate: (route: string) => void;
  onKeyDown: (e: React.KeyboardEvent, route: string, enabled: boolean) => void;
}

function NavigationItemRenderer({
  item,
  onNavigate,
  onKeyDown,
}: NavigationItemRendererProps) {
  if (item.avatar) {
    return (
      <AvatarItem item={item} onNavigate={onNavigate} onKeyDown={onKeyDown} />
    );
  }

  return (
    <button
      type="button"
      aria-label={item.label}
      tabIndex={0}
      disabled={!item.enabled}
      onClick={() => item.enabled && onNavigate(item.route)}
      onKeyDown={(e) => onKeyDown(e, item.route, item.enabled)}
      className={`
        relative
        flex flex-col items-center justify-center
        w-16 h-16
        rounded-2xl
        transition-all duration-200 ease-in-out
        text-blue-100
        ${!item.enabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100
      `}
    >
      <MaterialIcon name={item.icon} active={item.active} />

      {item.label && (
        <span className="text-[11px] font-medium mt-1 leading-none">
          {item.label}
        </span>
      )}

      {item.notification && (
        <span className="absolute top-2 right-4 w-3 h-3 rounded-full bg-red-100 border-2 border-white" />
      )}
    </button>
  );
}

interface AvatarItemProps {
  item: NavigationItem;
  onNavigate: (route: string) => void;
  onKeyDown: (e: React.KeyboardEvent, route: string, enabled: boolean) => void;
}

function AvatarItem({ item, onNavigate, onKeyDown }: AvatarItemProps) {
  return (
    <button
      type="button"
      aria-label="Perfil"
      tabIndex={0}
      disabled={!item.enabled}
      onClick={() => item.enabled && onNavigate(item.route)}
      onKeyDown={(e) => onKeyDown(e, item.route, item.enabled)}
      className={`
        relative
        flex items-center justify-center
        transition-all duration-200 ease-in-out
        ${!item.enabled ? "opacity-40 pointer-events-none" : "cursor-pointer"}
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100
      `}
    >
      {item.avatarUrl ? (
        <img
          src={item.avatarUrl}
          alt="Avatar"
          className="w-18 h-18 rounded-full object-cover border-2 border-blue-100"
        />
      ) : (
        <span
          className="material-symbols-outlined text-[72px] text-blue-100"
          style={{
            fontSize: "72px",
            fontVariationSettings: `'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 72`,
          }}
        >
          account_circle
        </span>
      )}
    </button>
  );
}
