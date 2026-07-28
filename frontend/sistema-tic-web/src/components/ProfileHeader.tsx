import type { User } from "../pages/ProfilePage";

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
      <div className="relative mb-5 mt-13">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`Foto de perfil de ${user.fullName}`}
            className="size-50 rounded-full border-2 border-blue-100 bg-card-background object-cover"
          />
        ) : (
          <div className="flex size-50 items-center justify-center rounded-full border-2 border-blue-100 bg-card-background">
            <span
              className="material-symbols-outlined text-blue-100"
              style={{
                fontSize: 248,
                fontWeight: 300,
                fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 248",
              }}
            >
              account_circle
            </span>
          </div>
        )}

        {mode === "self" && (
          <button
            type="button"
            onClick={onEditClick}
            aria-label="Editar foto de perfil"
            className="absolute -bottom-1 right-8 flex size-10 items-center justify-center rounded-full border border-color-blue-100 bg-card-background shadow-sm"
          >
            <span
              className="material-symbols-outlined text-blue-100"
              style={{
                fontSize: 20,
                fontWeight: 300,
                fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20",
              }}
            >
              edit_square
            </span>
          </button>
        )}
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
