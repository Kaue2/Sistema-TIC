type SettingsProps = {
  onPersonalize?: () => void;
  onChangePassword?: () => void;
  onLogout?: () => void;
};

export function Settings({
  onPersonalize,
  onChangePassword,
  onLogout,
}: SettingsProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-medium text-black-80">
        Configurações
      </h2>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPersonalize}
          className="flex h-9 items-center gap-2 rounded-lg border border-blue-100 px-3 text-sm text-blue-100 transition-colors hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px" }}
          >
            palette
          </span>
          Personalizar
        </button>

        <button
          type="button"
          onClick={onChangePassword}
          className="flex h-9 items-center gap-2 rounded-lg border border-blue-100 px-3 text-sm text-blue-100 transition-colors hover:bg-blue-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px" }}
          >
            edit_square
          </span>
          Alterar senha
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="flex h-9 items-center gap-2 rounded-lg border border-red-100 px-3 text-sm text-red-100 transition-colors hover:bg-red-100/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-100"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "18px" }}
          >
            logout
          </span>
          Sair
        </button>
      </div>
    </section>
  );
}
