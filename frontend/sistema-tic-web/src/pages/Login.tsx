import { useState } from "react";
import { VisibilityRounded, ErrorRounded } from "@mui/icons-material";
import { Input } from "../components/Input";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors] = useState<string[]>([]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
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

        <form className="space-y-4">
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
            icon={<VisibilityRounded />}
            iconPosition="right"
            iconMouseDownAction={() => setShowPassword(true)}
            iconMouseUpAction={() => setShowPassword(false)}
          />

          <div className={`flex flex-col items-center gap-2 ${errors.length > 0 ? 'mt-6' : 'mt-13'}`}>
            {errors.length > 0 && (
              errors.map((error, index) => (
                <p key={index} className="text-red-100 text-sm">
                  <ErrorRounded className="inline-block mr-2" />
                  {error}
                </p>
              ))
            )}

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
