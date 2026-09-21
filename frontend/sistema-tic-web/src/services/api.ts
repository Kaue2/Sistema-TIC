import axios from "axios";

const configuredBaseUrl =
  import.meta.env.VITE_API_URL ?? "http://localhost:5246/api/";

export const api = axios.create({
  baseURL: configuredBaseUrl.endsWith("/")
    ? configuredBaseUrl
    : `${configuredBaseUrl}/`,
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
