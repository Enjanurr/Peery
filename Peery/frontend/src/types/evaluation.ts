import type { EvaluationState } from './project.ts';

export type EvaluationStatus = 'NOT_STARTED' | 'SUBMITTED';

export interface Criterion {
  id: number;
  name: string;
  description: string | null;
  minScore: number;
  maxScore: number;
}

export interface EvaluationWindow {
  projectId: number;
  evalStartDate: string;
  evalEndDate: string;
  state: EvaluationState;
  serverTime: string;
}

export interface PendingTeammate {
  evaluateeId: number;
  evaluateeName: string;
  status: EvaluationStatus;
  evaluationId: number | null;
}

export interface PendingEvaluations {
  projectId: number;
  completedCount: number;
  totalCount: number;
  teammates: PendingTeammate[];
}

export interface ScoreValue {
  criterionId: number;
  score: number;
}

export interface ScoreResult {
  criterionId: number;
  criterionName: string;
  score: number;
}

/** An evaluation the signed-in student wrote. It never contains evaluator fields. */
export interface Evaluation {
  id: number;
  projectId: number;
  evaluateeId: number;
  evaluateeName: string;
  scores: ScoreResult[];
  comment: string | null;
  submittedAt: string;
  updatedAt: string | null;
  version: number;
  editable: boolean;
}

export interface EvaluationFormValues {
  scores: ScoreValue[];
  comment: string;
}

export interface CreateEvaluationPayload extends EvaluationFormValues {
  projectId: number;
  evaluateeId: number;
}

export interface UpdateEvaluationPayload extends EvaluationFormValues {
  version: number;
}