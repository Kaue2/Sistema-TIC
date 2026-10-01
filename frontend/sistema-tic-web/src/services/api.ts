import axios from "axios";

const devFallback = "http://localhost:5246/api/";
const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

if (import.meta.env.PROD && !configuredBaseUrl) {
  throw new Error("VITE_API_URL é obrigatória no build de produção.");
}

export const api = axios.create({
  baseURL: configuredBaseUrl
    ? configuredBaseUrl.endsWith("/")
      ? configuredBaseUrl
      : `${configuredBaseUrl}/`
    : devFallback,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export interface CustomJwtDecode {
  sub: string;
  email: string;
  role: string;
}
