import { api } from "./api";

export interface AuthenticateUserDTO {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
}

export async function authenticateUser(
  dto: AuthenticateUserDTO,
): Promise<string> {
  const response = await api.post<string>("auth/login", dto);

  localStorage.setItem("token", response.data);

  return response.data;
}
