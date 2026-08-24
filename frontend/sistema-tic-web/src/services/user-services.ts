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
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
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
  await api.post("user/change-password", dto);
}

export interface MemberScheduleItemDTO {
  day: string;
  start: string;
  end: string;
}

export interface CreateUserDTO {
  name: string;
  emailEducacional: string;
  emailAdministrativo: string;
  roleCode: string;
  totalHours: string;
  location: string;
  schedule: MemberScheduleItemDTO[];
}

export async function createUser(dto: CreateUserDTO): Promise<string> {
  const response = await api.post<string>("user/create-user", dto);
  return response.data;
}

export interface UserContactSummaryDTO {
  contactType: string;
  contactValue: string;
  label: string | null;
  isPrimary: boolean;
}

export interface UserAvailabilitySummaryDTO {
  weekday: number;
  startsAt: string;
  endsAt: string;
}

export interface UserProfileResponseDTO {
  id: string;
  name: string;
  email: string;
  roleName: string | null;
  workLocation: string | null;
  weeklyWorkloadMinutes: number | null;
  lattesUrl: string | null;
  contacts: UserContactSummaryDTO[];
  availability: UserAvailabilitySummaryDTO[];
}

export async function getUserProfile(id: string): Promise<UserProfileResponseDTO> {
  const response = await api.get<UserProfileResponseDTO>(`user/${id}/profile`);
  return response.data;
}

export interface MemberSummaryDTO {
  id: string;
  fullName: string;
  roleCode: string;
  institutionalEmail: string;
  administrativeEmail: string | null;
  workLocation: string | null;
  availability: UserAvailabilitySummaryDTO[];
}

export async function getMembers(): Promise<MemberSummaryDTO[]> {
  const response = await api.get<MemberSummaryDTO[]>("user/members");
  return response.data;
}