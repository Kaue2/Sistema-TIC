import { useState } from "react";
import { VisibilityRounded, ErrorRounded } from "@mui/icons-material";

export function Login() {
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
          <div className="relative">
            <input
              id="email"
              type="email"
              placeholder=" "
              className="
                peer
                h-12
                w-full
                rounded
                border
                border-black-20
                px-3
                text-base
                outline-none
                transition-all
                duration-200
                focus:border-blue-700
              "
            />

            <label
              htmlFor="email"
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                bg-background
                px-1
                text-base
                text-black-60
                transition-all
                duration-200

                peer-focus:-top-2
                peer-focus:translate-y-0
                peer-focus:text-xs
                peer-focus:text-blue-700

                peer-not-placeholder-shown:-top-2
                peer-not-placeholder-shown:translate-y-0
                peer-not-placeholder-shown:text-xs
              "
            >
              Endereço de E-mail
            </label>
          </div>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder=" "
              className="
                peer
                h-12
                w-full
                rounded
                border
                border-black-20
                px-3
                pr-10
                text-base
                outline-none
                transition-all
                duration-200
                focus:border-blue-700
              "
            />

            <label
              htmlFor="password"
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                bg-background
                px-1
                text-base
                text-black-60
                transition-all
                duration-200

                peer-focus:-top-2
                peer-focus:translate-y-0
                peer-focus:text-xs
                peer-focus:text-blue-700

                peer-not-placeholder-shown:-top-2
                peer-not-placeholder-shown:translate-y-0
                peer-not-placeholder-shown:text-xs
              "
            >
              Senha
            </label>

            <button
              type="button"
              onMouseDown={() => setShowPassword(true)}
              onMouseUp={() => setShowPassword(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
            >
              <VisibilityRounded 
                className={`${showPassword ? "opacity-50" : "opacity-100"}`}
              />
            </button>
          </div>


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
