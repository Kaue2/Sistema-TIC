import { jwtDecode } from "jwt-decode";
import type { CustomJwtDecode } from "./api";

const USER_STORAGE_KEY = "@SistemaTIC:user";
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function getCurrentUserId(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return jwtDecode<CustomJwtDecode>(token).sub;
  } catch {
    return null;
  }
}

export function getCurrentUserRole(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode<Record<string, unknown>>(token);
    const role = decoded[ROLE_CLAIM];
    return typeof role === "string" && role !== "" ? role : null;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem("token");
  localStorage.removeItem(USER_STORAGE_KEY);
}
