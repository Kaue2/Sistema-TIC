import { jwtDecode } from "jwt-decode";
import type { CustomJwtDecode } from "./api";

const USER_STORAGE_KEY = "@SistemaTIC:user";

export function getCurrentUserId(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return jwtDecode<CustomJwtDecode>(token).sub;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem("token");
  localStorage.removeItem(USER_STORAGE_KEY);
}
