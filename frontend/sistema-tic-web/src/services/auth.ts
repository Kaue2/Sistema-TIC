import { jwtDecode } from "jwt-decode";
import type { CustomJwtDecode } from "./api";

export function getCurrentUserId(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return jwtDecode<CustomJwtDecode>(token).sub;
  } catch {
    return null;
  }
}
