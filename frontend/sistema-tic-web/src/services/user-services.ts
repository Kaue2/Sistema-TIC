import { api } from "./api";

export interface AuthenticateUserDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  token: string;
  email: string;
  name: string;
  roleName: string;
  mustChangePassword: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  roleId: string;
}

export interface ChangeUserPasswordDTO {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export async function authenticateUser(
  dto: AuthenticateUserDTO,
): Promise<AuthResponseDTO> {
  const response = await api.post<AuthResponseDTO>("auth/login", dto);

  localStorage.setItem("token", response.data.token);

  return response.data;
}

export async function changeUserPassword(
  dto: ChangeUserPasswordDTO,
): Promise<void> {
  await api.post("auth/change-password", dto);
}