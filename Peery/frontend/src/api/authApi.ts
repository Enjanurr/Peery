import axiosClient from './axiosClient.ts';
import type {
  AuthResponse,
  LoginPayload,
  PingResponse,
  RegisterPayload,
  User,
} from '../types/auth.ts';

export type PingArea = 'student' | 'instructor';

export const register = (payload: RegisterPayload): Promise<AuthResponse> =>
  axiosClient.post<AuthResponse>('/auth/register', payload).then((res) => res.data);

export const login = (payload: LoginPayload): Promise<AuthResponse> =>
  axiosClient.post<AuthResponse>('/auth/login', payload).then((res) => res.data);

export const getMe = (): Promise<User> =>
  axiosClient.get<User>('/users/me').then((res) => res.data);

// Temporary RBAC probes (match RbacProbeController on the backend)
export const ping = (area: PingArea): Promise<PingResponse> =>
  axiosClient.get<PingResponse>(`/${area}/ping`).then((res) => res.data);