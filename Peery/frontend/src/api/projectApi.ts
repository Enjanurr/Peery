import axiosClient from './axiosClient.ts';
import type {
  Project,
  ProjectDetail,
  ProjectPayload,
  StudentProject,
  StudentSummary,
  Team,
} from '../types/project.ts';

// ---- Instructor: projects ----
export const listInstructorProjects = (): Promise<Project[]> =>
  axiosClient.get<Project[]>('/instructor/projects').then((res) => res.data);

export const getProject = (projectId: number): Promise<ProjectDetail> =>
  axiosClient.get<ProjectDetail>(`/instructor/projects/${projectId}`).then((res) => res.data);

export const createProject = (payload: ProjectPayload): Promise<Project> =>
  axiosClient.post<Project>('/instructor/projects', payload).then((res) => res.data);

export const updateProject = (projectId: number, payload: ProjectPayload): Promise<Project> =>
  axiosClient.put<Project>(`/instructor/projects/${projectId}`, payload).then((res) => res.data);

export const deleteProject = (projectId: number): Promise<void> =>
  axiosClient.delete(`/instructor/projects/${projectId}`).then(() => undefined);

// ---- Instructor: teams ----
export const createTeam = (projectId: number, name: string): Promise<Team> =>
  axiosClient
    .post<Team>(`/instructor/projects/${projectId}/teams`, { name })
    .then((res) => res.data);

export const deleteTeam = (projectId: number, teamId: number): Promise<void> =>
  axiosClient.delete(`/instructor/projects/${projectId}/teams/${teamId}`).then(() => undefined);

export const addTeamMember = (
  projectId: number,
  teamId: number,
  studentId: number,
): Promise<Team> =>
  axiosClient
    .post<Team>(`/instructor/projects/${projectId}/teams/${teamId}/members`, { studentId })
    .then((res) => res.data);

export const removeTeamMember = (
  projectId: number,
  teamId: number,
  studentId: number,
): Promise<void> =>
  axiosClient
    .delete(`/instructor/projects/${projectId}/teams/${teamId}/members/${studentId}`)
    .then(() => undefined);

// ---- Instructor: roster ----
export const listStudents = (): Promise<StudentSummary[]> =>
  axiosClient.get<StudentSummary[]>('/instructor/students').then((res) => res.data);

// ---- Student ----
export const listMyProjects = (): Promise<StudentProject[]> =>
  axiosClient.get<StudentProject[]>('/student/projects').then((res) => res.data);