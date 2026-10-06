import { Navigate, Outlet } from "react-router-dom";

export function RequireAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}