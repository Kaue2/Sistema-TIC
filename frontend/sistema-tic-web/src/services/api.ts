import axios, { isAxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  redirectToLogin,
  saveSession,
} from "./auth";

const devFallback = "http://localhost:5246/api/";
const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

if (import.meta.env.PROD && !configuredBaseUrl) {
  throw new Error("VITE_API_URL é obrigatória no build de produção.");
}

const baseURL = configuredBaseUrl
  ? configuredBaseUrl.endsWith("/")
    ? configuredBaseUrl
    : `${configuredBaseUrl}/`
  : devFallback;

export const api = axios.create({ baseURL });

// Cliente sem interceptors para renovar o token: se passasse pelo `api`, uma falha na renovação
// dispararia outra renovação.
const refreshClient = axios.create({ baseURL });

// login/refresh/logout não levam token e um 401 neles não deve disparar renovação
const AUTH_ENDPOINT = /^\/?auth\/(login|refresh|logout)/;
function isAuthEndpoint(url?: string) {
  return !!url && AUTH_ENDPOINT.test(url);
}

// Renova o access token ~10s antes de vencer, para não gastar uma requisição à toa com 401.
const RENEW_MARGIN_SECONDS = 10;

function endSession() {
  clearSession();
  redirectToLogin({ sessionExpired: true });
}

async function renewTokens(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    // sessão antiga (sem refresh token) ou já encerrada
    endSession();
    throw new Error("Sessão expirada.");
  }

  try {
    const response = await refreshClient.post<{ token: string; refreshToken: string }>(
      "auth/refresh",
      { refreshToken }
    );
    saveSession(response.data.token, response.data.refreshToken);
    return response.data.token;
  } catch (error) {
    // Falha de rede/servidor não encerra a sessão: o usuário pode tentar de novo.
    if (!isAxiosError(error) || error.response?.status !== 401) throw error;

    // O refresh token é de uso único: se outra aba renovou primeiro, o token guardado já é
    // outro (e válido), então usa o dele em vez de derrubar a sessão.
    const currentAccessToken = getAccessToken();
    if (
      getRefreshToken() !== refreshToken &&
      currentAccessToken &&
      !isTokenExpired(currentAccessToken)
    ) {
      return currentAccessToken;
    }

    endSession();
    throw error;
  }
}

// Várias requisições podem vencer juntas; todas esperam a mesma renovação (o refresh token só
// pode ser usado uma vez).
let renewal: Promise<string> | null = null;
export function refreshAccessToken(): Promise<string> {
  renewal ??= renewTokens().finally(() => {
    renewal = null;
  });
  return renewal;
}

api.interceptors.request.use(
  async (config) => {
    if (isAuthEndpoint(config.url)) return config;

    let token = getAccessToken();
    if (token && isTokenExpired(token, RENEW_MARGIN_SECONDS)) {
      token = await refreshAccessToken();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (
      !isAxiosError(error) ||
      error.response?.status !== 401 ||
      !original ||
      original._retried ||
      isAuthEndpoint(original.url)
    ) {
      return Promise.reject(error);
    }

    // o servidor recusou o token (expirado, revogado...): renova uma vez e refaz a requisição
    original._retried = true;
    const token = await refreshAccessToken();
    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);

export interface CustomJwtDecode {
  sub: string;
  email: string;
  role: string;
  exp: number;
}
