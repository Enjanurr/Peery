import axiosClient from './axiosClient.ts';
import type {
  AttributionResponse,
  GradeOverride,
  Gradebook,
  OverridePayload,
  RevokePayload,
  StudentGrade,
} from '../types/grades.ts';

export const getAttribution = (projectId: number): Promise<AttributionResponse> =>
  axiosClient
    .get<AttributionResponse>(`/instructor/projects/${projectId}/attribution`)
    .then((res) => res.data);

export const getGradebook = (projectId: number): Promise<Gradebook> =>
  axiosClient.get<Gradebook>(`/instructor/projects/${projectId}/grades`).then((res) => res.data);

export const setOverride = (
  projectId: number,
  studentId: number,
  payload: OverridePayload,
): Promise<GradeOverride> =>
  axiosClient
    .put<GradeOverride>(`/instructor/projects/${projectId}/students/${studentId}/override`, payload)
    .then((res) => res.data);

export const revokeOverride = (
  projectId: number,
  studentId: number,
  payload: RevokePayload,
): Promise<GradeOverride> =>
  axiosClient
    .post<GradeOverride>(
      `/instructor/projects/${projectId}/students/${studentId}/override/revoke`,
      payload,
    )
    .then((res) => res.data);

export const getOverrideHistory = (projectId: number, studentId: number): Promise<GradeOverride[]> =>
  axiosClient
    .get<GradeOverride[]>(`/instructor/projects/${projectId}/students/${studentId}/override/history`)
    .then((res) => res.data);

export const getMyGrade = (projectId: number): Promise<StudentGrade> =>
  axiosClient.get<StudentGrade>(`/student/projects/${projectId}/grade`).then((res) => res.data);