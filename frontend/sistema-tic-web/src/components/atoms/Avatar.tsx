type AvatarProps = {
  avatarUrl?: string;
  fullName: string;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onEditClick?: () => void;
  className?: string;
  iconSize?: number;
};

const sizeMap = {
  sm: { container: "size-12", icon: 64 },
  md: { container: "size-32", icon: 164 },
  lg: { container: "size-50", icon: 248 },
} as const;

export function Avatar({
  avatarUrl,
  fullName,
  size = "md",
  editable = false,
  onEditClick,
  className = "",
  iconSize,
}: AvatarProps) {
  const { container, icon: defaultIconSize } = sizeMap[size];
  const displayedIconSize = iconSize ?? defaultIconSize;

  return (
    <div className="relative">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`Foto de perfil de ${fullName}`}
          className={`${container} ${className} rounded-full border-2 border-blue-100 bg-card-background object-cover`}
        />
      ) : (
        <div
          className={`${container} ${className} flex items-center justify-center rounded-full border-blue-100 bg-card-background`}
        >
          <span
            className="material-symbols-outlined text-blue-100"
            style={{
              fontSize: displayedIconSize,
              fontVariationSettings: `'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' ${displayedIconSize}`,
            }}
          >
            account_circle
          </span>
        </div>
      )}

      {editable && (
        <button
          type="button"
          onClick={onEditClick}
          aria-label="Editar foto de perfil"
          className="absolute -bottom-1 right-8 flex size-11 items-center justify-center rounded-full border border-blue-100 bg-card-background shadow-sm"
        >
          <span
            className="material-symbols-outlined text-blue-100"
            style={{
              fontSize: 24,
              fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24",
            }}
          >
            edit_square
          </span>
        </button>
      )}
    </div>
  );
}
