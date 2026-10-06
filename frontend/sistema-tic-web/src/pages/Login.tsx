import { useCallback, useEffect, useState, type SubmitEventHandler } from "react";
import { Input } from "../components/atoms/Input";
import { Toast, type ToastType } from "../components/organisms/Toast";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { type CustomJwtDecode } from "../services/api";
import { clearSessionExpired, wasSessionExpired } from "../services/auth";
import {
  type AuthenticateUserDTO,
  authenticateUser,
  type AuthResponseDTO,
} from "../services/user-services";
import { useUser } from "../contexts/userContext";
import { getCurrentUserRole } from "../services/auth";

const APP_VERSION = "1.0.0";

// tempo que o aviso de login bem-sucedido fica na tela antes de seguir
const REDIRECT_DELAY_MS = 2000;

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors] = useState<string[]>([]);

  // Se chegou aqui porque a sessão expirou (ver redirectToLogin), já abre avisando, uma única vez.
  // O id muda a cada aviso para o Toast reiniciar o próprio temporizador.
  const [toast, setToast] = useState<{ id: number; message: string; type: ToastType } | null>(() =>
    wasSessionExpired()
      ? { id: Date.now(), message: "Sua sessão expirou. Entre novamente.", type: "error" }
      : null,
  );
  useEffect(() => {
    clearSessionExpired();
  }, []);

  const navigate = useNavigate();
  const { setUserData } = useUser();

  // login feito: segue para a próxima tela depois de REDIRECT_DELAY_MS...
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  useEffect(() => {
    if (!redirectPath) return;
    const timer = setTimeout(() => navigate(redirectPath), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [redirectPath, navigate]);

  // ...ou na hora, se o usuário fechar o aviso antes
  const closeToast = useCallback(() => {
    if (redirectPath) navigate(redirectPath);
    setToast(null);
  }, [redirectPath, navigate]);

  const sendAuthenticateRequest: SubmitEventHandler<HTMLFormElement> = async (
    e,
  ) => {
    e.preventDefault();
    if (redirectPath) return; // login já feito, só aguardando o redirecionamento

    const dto: AuthenticateUserDTO = {
      email: email,
      password: password,
    };

    try {
      const response: AuthResponseDTO = await authenticateUser(dto);
      const decoded = jwtDecode<CustomJwtDecode>(response.token);

      setUserData({
        id: decoded.sub,
        email: response.email,
        name: response.name,
        roleName: getCurrentUserRole() ?? "",
      });

      setToast({ id: Date.now(), message: "Login realizado com sucesso!", type: "success" });
      setRedirectPath(response.mustChangePassword == true ? "/access-update" : `/profile/${decoded.sub}`);
    } catch (error) {
      console.log(error);
      setToast({
        id: Date.now(),
        message: "Não foi possível entrar. Confira seu e-mail e sua senha.",
        type: "error",
      });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xl text-black-80 font-regular">
            Centro Universitário Senac Santo Amaro
          </p>

          <h1 className="mt-1 text-6xl font-regular tracking-tight text-blue-100 ">
            TIC em Trilhas
          </h1>

          <p className="mt-2 text-xl text-black-80 font-regular">
            Pesquisa e Extensão Universitária
          </p>
        </div>

        <form className="space-y-4" onSubmit={sendAuthenticateRequest}>
          <Input
            id="email"
            type="email"
            label="Endereço de E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            label="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={
              <span
                className={`material-symbols-outlined text-[20px] ${showPassword ? "opacity-50" : "opacity-100"}`}
                style={{
                  fontVariationSettings:
                    "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                visibility
              </span>
            }
            iconPosition="right"
            iconMouseDownAction={() => setShowPassword(true)}
            iconMouseUpAction={() => setShowPassword(false)}
          />

          <div
            className={`flex flex-col items-center gap-2 ${errors.length > 0 ? "mt-6" : "mt-13"}`}
          >
            {errors.length > 0 &&
              errors.map((error, index) => (
                <p
                  key={index}
                  className="text-red-100 text-sm flex items-center gap-1"
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={{
                      fontVariationSettings:
                        "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    }}
                  >
                    error
                  </span>
                  {error}
                </p>
              ))}

            <button
              type="submit"
              className="w-full rounded bg-blue-100 py-2 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-blue-800 cursor-pointer"
            >
              Avançar
            </button>
          </div>
        </form>
      </div>

      <footer className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 text-center text-xs text-black-40">
        <p>
          © {new Date().getFullYear()} TIC em Trilhas — Todos os direitos
          reservados.
        </p>
        <p>v{APP_VERSION} · Powered by Senac SP</p>
      </footer>

      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={closeToast} />
      )}
    </div>
  );
}
