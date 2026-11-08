export type ProfileRole = 'STUDENT' | 'INSTRUCTOR';

export interface Profile {
  id: number;
  email: string;
  fullName: string;
  role: ProfileRole;
  studentNumber: string | null;
  program: string | null;
  employeeCode: string | null;
  department: string | null;
}

export interface UpdateProfilePayload {
  fullName: string;
  email: string;
  studentNumber?: string;
  program?: string;
  employeeCode?: string;
  department?: string;
  /** Only needed when the email changes. */
  currentPassword?: string;
}

export interface UpdateProfileResult {
  profile: Profile;
  reauthRequired: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordResult {
  message: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}