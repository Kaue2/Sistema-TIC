import { useState, type SubmitEventHandler } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../components/atoms/Input";
import { changeUserPassword, type ChangeUserPasswordDTO } from "../services/user-services";
import { useUser } from "../contexts/userContext";

export function AccessUpdate() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [errors] = useState<string[]>([]);

  const navigate = useNavigate();
  const { userData } = useUser();

  const sendChangePasswordRequest: SubmitEventHandler<HTMLFormElement> = async (
    e,
  ) => {
    e.preventDefault();

    const dto: ChangeUserPasswordDTO = {
      oldPassword: oldPassword,
      newPassword: newPassword,
      confirmNewPassword: confirmNewPassword,
    };

    try {
      await changeUserPassword(dto);
      window.alert("Senha alterada com sucesso!");
      if (userData?.id)
        navigate(`/profile/${userData?.id}`);
    } catch (error) {
      console.log(error);
      window.alert("Erro ao efetuar login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col gap-14 w-full max-w-sm">
        <div className="mb-1 text-center">
          <h1 className="text-6xl font-regular tracking-tight text-blue-100 ">
            Atualize seus dados de acesso
          </h1>

          <p className="mt-2 text-xl text-black-80 font-regular">
            Insira sua senha atual e escolha uma nova par continuar
          </p>
        </div>

        <form className="space-y-8" onSubmit={sendChangePasswordRequest}>
          <Input
            id="password"
            type={showOldPassword ? "text" : "password"}
            label="Senha Antiga"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            icon={
              <span
                className={`material-symbols-outlined text-[20px] ${showOldPassword ? "opacity-50" : "opacity-100"}`}
                style={{
                  fontVariationSettings:
                    "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                visibility
              </span>
            }
            iconPosition="right"
            iconMouseDownAction={() => setShowOldPassword(true)}
            iconMouseUpAction={() => setShowOldPassword(false)}
          />

          <Input
            id="password"
            type={showNewPassword ? "text" : "password"}
            label="Senha Nova"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            icon={
              <span
                className={`material-symbols-outlined text-[20px] ${showNewPassword ? "opacity-50" : "opacity-100"}`}
                style={{
                  fontVariationSettings:
                    "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                visibility
              </span>
            }
            iconPosition="right"
            iconMouseDownAction={() => setShowNewPassword(true)}
            iconMouseUpAction={() => setShowNewPassword(false)}
          />

          <Input
            id="password"
            type={showConfirmNewPassword ? "text" : "password"}
            label="Confirmar Senha Nova"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            icon={
              <span
                className={`material-symbols-outlined text-[20px] ${showConfirmNewPassword ? "opacity-50" : "opacity-100"}`}
                style={{
                  fontVariationSettings:
                    "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                }}
              >
                visibility
              </span>
            }
            iconPosition="right"
            iconMouseDownAction={() => setShowConfirmNewPassword(true)}
            iconMouseUpAction={() => setShowConfirmNewPassword(false)}
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
    </div>
  );
}
