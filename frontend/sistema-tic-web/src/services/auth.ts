import { jwtDecode } from "jwt-decode";
import type { CustomJwtDecode } from "./api";

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";
// mesma chave que o UserProvider usa para guardar o usuário logado
const USER_KEY = "@SistemaTIC:user";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveSession(token: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Marca (só até o próximo carregamento do login) que a sessão caiu por expiração, para o login avisar.
const SESSION_EXPIRED_KEY = "sessionExpired";

export function wasSessionExpired(): boolean {
  return sessionStorage.getItem(SESSION_EXPIRED_KEY) === "1";
}

export function clearSessionExpired() {
  sessionStorage.removeItem(SESSION_EXPIRED_KEY);
}

// Leva para o login. O reload completo também zera o estado em memória (contexto do usuário).
// Com sessionExpired, a tela de login mostra o aviso de sessão expirada.
export function redirectToLogin(options: { sessionExpired?: boolean } = {}) {
  if (window.location.pathname === "/") return;
  if (options.sessionExpired) sessionStorage.setItem(SESSION_EXPIRED_KEY, "1");
  window.location.assign("/");
}

// Token ilegível ou sem exp conta como expirado. marginSeconds renova um pouco antes de vencer.
export function isTokenExpired(token: string, marginSeconds = 0): boolean {
  try {
    const { exp } = jwtDecode<CustomJwtDecode>(token);
    if (typeof exp !== "number") return true;
    return exp * 1000 <= Date.now() + marginSeconds * 1000;
  } catch {
    return true;
  }
}

export function getCurrentUserId(): string | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    return jwtDecode<CustomJwtDecode>(token).sub;
  } catch {
    return null;
  }
}
