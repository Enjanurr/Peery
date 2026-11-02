export type Role = 'STUDENT' | 'INSTRUCTOR';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  inviteCode?: string;
}

/** Error body returned by the backend (ApiError). */
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface ParsedApiError {
  message: string;
  fieldErrors: Record<string, string>;
}

export interface PingResponse {
  message: string;
  user: string;
}