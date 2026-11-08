import axiosClient from './axiosClient.ts';
import type { ProjectResults, StudentResultSummaryDTO } from '../types/results.ts';

export const getMyResults = (projectId: number): Promise<StudentResultSummaryDTO> =>
  axiosClient
    .get<StudentResultSummaryDTO>(`/student/projects/${projectId}/results`)
    .then((res) => res.data);

export const getProjectResults = (projectId: number): Promise<ProjectResults> =>
  axiosClient
    .get<ProjectResults>(`/instructor/projects/${projectId}/results`)
    .then((res) => res.data);