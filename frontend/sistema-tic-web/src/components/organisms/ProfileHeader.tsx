import type { User } from "../../pages/ProfilePage";
import { Avatar } from "../atoms/Avatar";

type ProfileHeaderProps = {
  user: User;
  mode: "self" | "user";
  onEditClick?: () => void;
};

export function ProfileHeader({
  user,
  mode,
  onEditClick,
}: ProfileHeaderProps) {
  return (
    <header className="flex flex-col items-center">
      <div className="mb-5 mt-13">
        <Avatar
          avatarUrl={user.avatar}
          fullName={user.fullName}
          size="lg"
          editable={mode === "self"}
          onEditClick={onEditClick}
        />
      </div>

      <div className="relative flex items-center justify-center">
        <h1 className="text-[32px] font-medium leading-none text-black-80">
          {user.fullName || "-"}
        </h1>

        {mode === "self" && (
          <button
            type="button"
            onClick={onEditClick}
            aria-label="Editar perfil"
            className="absolute -right-27.5 ml-3 flex h-9 items-center gap-2 rounded-lg border border-blue-100 px-3 text-sm text-blue-100 transition-colors hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 18,
                fontWeight: 300,
                fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 18",
              }}
            >
              edit_square
            </span>

            Editar
          </button>
        )}
      </div>

      <p className="mt-2 text-2xl text-black-60">
        {user.role || "-"}
      </p>
    </header>
  );
}
