import axiosClient from './axiosClient.ts';
import type {
  ChangePasswordPayload,
  ForgotPasswordResult,
  Profile,
  ResetPasswordPayload,
  UpdateProfilePayload,
  UpdateProfileResult,
} from '../types/profile.ts';

export const getProfile = (): Promise<Profile> =>
  axiosClient.get<Profile>('/users/me/profile').then((res) => res.data);

export const updateProfile = (payload: UpdateProfilePayload): Promise<UpdateProfileResult> =>
  axiosClient.put<UpdateProfileResult>('/users/me/profile', payload).then((res) => res.data);

export const changePassword = (payload: ChangePasswordPayload): Promise<void> =>
  axiosClient.put('/users/me/password', payload).then(() => undefined);

export const forgotPassword = (email: string): Promise<ForgotPasswordResult> =>
  axiosClient.post<ForgotPasswordResult>('/auth/password/forgot', { email }).then((res) => res.data);

export const resetPassword = (payload: ResetPasswordPayload): Promise<void> =>
  axiosClient.post('/auth/password/reset', payload).then(() => undefined);