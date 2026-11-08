import type { ScoreResult } from './evaluation.ts';
import type { EvaluationState } from './project.ts';

export type OverrideAction = 'SET' | 'REVOKE';

export interface PersonRef {
  id: number;
  fullName: string;
}

export interface AttributedEvaluation {
  evaluationId: number;
  teamName: string;
  evaluator: PersonRef;
  evaluatee: PersonRef;
  scores: ScoreResult[];
  comment: string | null;
  submittedAt: string;
  updatedAt: string | null;
}

export interface AttributionResponse {
  projectId: number;
  projectTitle: string;
  evaluationState: EvaluationState;
  evaluations: AttributedEvaluation[];
}

export interface GradebookRow {
  studentId: number;
  fullName: string;
  teamName: string;
  computedPercent: number | null;
  overridePercent: number | null;
  finalPercent: number | null;
  overridden: boolean;
  overriddenAt: string | null;
  overrideReason: string | null;
}

export interface Gradebook {
  projectId: number;
  projectTitle: string;
  evaluationState: EvaluationState;
  rows: GradebookRow[];
}

export interface GradeOverride {
  id: number;
  studentId: number;
  studentName: string;
  action: OverrideAction;
  overridePercent: number | null;
  computedPercent: number | null;
  reason: string;
  instructorId: number;
  instructorName: string;
  createdAt: string;
}

export interface OverridePayload {
  overridePercent: number;
  reason: string;
}

export interface RevokePayload {
  reason: string;
}

/** A student's own grade. There is no reason field by design. */
export interface StudentGrade {
  projectId: number;
  computedPercent: number | null;
  finalPercent: number | null;
  adjusted: boolean;
  adjustedAt: string | null;
}