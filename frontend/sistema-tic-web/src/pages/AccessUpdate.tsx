import { useState } from "react";

type AccessUpdateVariant = "default" | "visible" | "error";

type AccessUpdateProps = {
  variant?: AccessUpdateVariant;
};

const initialValuesByVariant: Record<
  AccessUpdateVariant,
  {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    visibleField?: keyof PasswordVisibility;
    error?: string;
  }
> = {
  default: {
    currentPassword: "senhadoze34",
    newPassword: "novasenha123",
    confirmPassword: "novasenha123",
  },
  visible: {
    currentPassword: "senhadoze34",
    newPassword: "novasenha123",
    confirmPassword: "Nósdoctop",
    visibleField: "confirmPassword",
  },
  error: {
    currentPassword: "senhadoze34",
    newPassword: "novasenha123",
    confirmPassword: "senhainvalida",
    error: "Ops! Dados de acesso incorretos. Tente novamente.",
  },
};

type PasswordVisibility = {
  currentPassword: boolean;
  newPassword: boolean;
  confirmPassword: boolean;
};

export function AccessUpdate({ variant = "default" }: AccessUpdateProps) {
  const initialValues = initialValuesByVariant[variant];
  const [visibility, setVisibility] = useState<PasswordVisibility>({
    currentPassword: initialValues.visibleField === "currentPassword",
    newPassword: initialValues.visibleField === "newPassword",
    confirmPassword: initialValues.visibleField === "confirmPassword",
  });

  function toggleVisibility(field: keyof PasswordVisibility) {
    setVisibility((current) => ({
      ...current,
      [field]: !current[field],
    }));
  }

  return (
    <main className="min-h-screen bg-background px-6 text-black-80">
      <section className="mx-auto flex w-full max-w-[400px] flex-col items-center pt-24 sm:pt-40">
        <header className="text-center">
          <h1 className="text-[44px] leading-[0.95] font-normal text-blue-100 sm:text-[52px]">
            Atualize seus
            <br />
            dados de acesso
          </h1>
          <p className="mt-4 text-lg leading-6 text-black-80">
            Insira sua senha atual e escolha
            <br />
            uma nova para continuar
          </p>
        </header>

        <form className="mt-8 w-full space-y-6" noValidate>
          <PasswordField
            id="current-password"
            label="Senha Atual"
            value={initialValues.currentPassword}
            isVisible={visibility.currentPassword}
            onToggleVisibility={() => toggleVisibility("currentPassword")}
          />
          <PasswordField
            id="new-password"
            label="Senha Nova"
            value={initialValues.newPassword}
            isVisible={visibility.newPassword}
            onToggleVisibility={() => toggleVisibility("newPassword")}
          />
          <PasswordField
            id="confirm-password"
            label="Confirmar Senha Nova"
            value={initialValues.confirmPassword}
            isVisible={visibility.confirmPassword}
            onToggleVisibility={() => toggleVisibility("confirmPassword")}
          />

          <div className="min-h-5">
            {initialValues.error && (
              <p className="flex items-center justify-center text-sm font-medium text-red-100">
                <span
                  className="material-symbols-outlined mr-2 text-base"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  error
                </span>
                {initialValues.error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="h-11 w-full rounded bg-blue-100 text-sm font-medium text-white uppercase shadow-md transition-colors hover:bg-blue-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
          >
            Avançar
          </button>
        </form>
      </section>
    </main>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
};

function PasswordField({
  id,
  label,
  value,
  isVisible,
  onToggleVisibility,
}: PasswordFieldProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type={isVisible ? "text" : "password"}
        value={value}
        readOnly
        className="h-12 w-full rounded border border-black-20 bg-background px-3 pr-11 text-base text-black-80 outline-none transition-colors focus:border-blue-100"
      />
      <label
        htmlFor={id}
        className="absolute -top-2 left-3 bg-background px-1 text-xs text-black-60"
      >
        {label}
      </label>
      <button
        type="button"
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        onClick={onToggleVisibility}
        className="absolute top-1/2 right-3 flex -translate-y-1/2 text-black-60 transition-colors hover:text-blue-100"
      >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  visibility
                </span>
      </button>
    </div>
  );
}
