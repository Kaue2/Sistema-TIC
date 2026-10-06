import { api } from "./api";
import { clearSession, getRefreshToken, redirectToLogin, saveSession } from "./auth";

export interface AuthenticateUserDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  token: string;
  refreshToken: string;
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

  saveSession(response.data.token, response.data.refreshToken);

  return response.data;
}

// Revoga o refresh token no servidor (melhor esforço: sair tem que funcionar mesmo sem rede)
// e encerra a sessão neste navegador.
export async function logoutUser(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await api.post("auth/logout", { refreshToken });
  } catch {
    // sem rede ou servidor fora: o token local é descartado de qualquer forma
  }
  clearSession();
  redirectToLogin();
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


export interface UpdateMemberDTO extends CreateUserDTO {
  trackIds: string[];
}

export interface MemberEditDTO {
  id: string;
  fullName: string;
  roleCode: string;
  institutionalEmail: string;
  administrativeEmail: string | null;
  workLocation: string | null;
  weeklyWorkloadMinutes: number | null;
  availability: UserAvailabilitySummaryDTO[];
  trackIds: string[];
}

export async function getMemberForEdit(id: string): Promise<MemberEditDTO> {
  const response = await api.get<MemberEditDTO>(`user/${id}/edit`);
  return response.data;
}

export async function updateMember(id: string, dto: UpdateMemberDTO): Promise<void> {
  await api.put(`user/${id}`, dto);
}

export interface UserProfileResponseDTO {
  id: string;
  name: string;
  email: string;
  roleName: string | null;
  workLocation: string | null;
  weeklyWorkloadMinutes: number | null;
  lattesUrl: string | null;
  curriculumUrl: string | null;
  contacts: UserContactSummaryDTO[];
  availability: UserAvailabilitySummaryDTO[];
}

export async function getUserProfile(id: string): Promise<UserProfileResponseDTO> {
  const response = await api.get<UserProfileResponseDTO>(`user/${id}/profile`);
  return response.data;
}

export interface UpdateProfileLinksDTO {
  curriculumUrl: string | null;
  lattesUrl: string | null;
}

export async function updateProfileLinks(
  id: string,
  dto: UpdateProfileLinksDTO,
): Promise<void> {
  await api.put(`user/${id}/profile`, dto);
}

export interface MemberSummaryDTO {
  id: string;
  fullName: string;
  roleCode: string;
  institutionalEmail: string;
  administrativeEmail: string | null;
  workLocation: string | null;
  weeklyWorkloadMinutes: number | null;
  availability: UserAvailabilitySummaryDTO[];
}

export async function getMembers(): Promise<MemberSummaryDTO[]> {
  const response = await api.get<MemberSummaryDTO[]>("user/members");
  return response.data;
}

export async function uploadUserPhoto(id: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  await api.post(`user/${id}/photo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// GET user/{id}/photo exige o token (interceptor do axios cuida disso), então uma <img src="...">
// direta não funciona: baixamos o blob e convertemos pra data URL. Usamos data URL (em vez de
// object URL) porque essa foto é cacheada em contexto/localStorage e precisa sobreviver a um
// reload da página; um blob: URL morre assim que a página que o criou é descarregada.
export async function getUserPhotoUrl(id: string): Promise<string | null> {
  try {
    const response = await api.get(`user/${id}/photo`, { responseType: "blob" });
    return await blobToDataUrl(response.data);
  } catch {
    return null;
  }
}
