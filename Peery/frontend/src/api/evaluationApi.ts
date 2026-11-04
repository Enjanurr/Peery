import axiosClient from './axiosClient.ts';
import type {
  CreateEvaluationPayload,
  Criterion,
  Evaluation,
  EvaluationWindow,
  PendingEvaluations,
  UpdateEvaluationPayload,
} from '../types/evaluation.ts';

export const getEvaluationWindow = (projectId: number): Promise<EvaluationWindow> =>
  axiosClient
    .get<EvaluationWindow>(`/student/projects/${projectId}/evaluation-window`)
    .then((res) => res.data);

export const getCriteria = (projectId: number): Promise<Criterion[]> =>
  axiosClient.get<Criterion[]>(`/student/projects/${projectId}/criteria`).then((res) => res.data);

export const getPendingEvaluations = (projectId: number): Promise<PendingEvaluations> =>
  axiosClient
    .get<PendingEvaluations>('/student/evaluations/pending', { params: { projectId } })
    .then((res) => res.data);

export const createEvaluation = (payload: CreateEvaluationPayload): Promise<Evaluation> =>
  axiosClient.post<Evaluation>('/student/evaluations', payload).then((res) => res.data);

export const updateEvaluation = (
  evaluationId: number,
  payload: UpdateEvaluationPayload,
): Promise<Evaluation> =>
  axiosClient
    .put<Evaluation>(`/student/evaluations/${evaluationId}`, payload)
    .then((res) => res.data);

export const listMyEvaluations = (projectId: number): Promise<Evaluation[]> =>
  axiosClient
    .get<Evaluation[]>('/student/evaluations/mine', { params: { projectId } })
    .then((res) => res.data);

export const getEvaluation = (evaluationId: number): Promise<Evaluation> =>
  axiosClient.get<Evaluation>(`/student/evaluations/${evaluationId}`).then((res) => res.data);