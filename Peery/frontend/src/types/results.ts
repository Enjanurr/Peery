import type { EvaluationState } from './project.ts';

export type ResultsVisibility = 'AVAILABLE' | 'INSUFFICIENT_RESPONSES';

export interface CriterionResult {
  criterionId: number;
  criterionName: string;
  minScore: number;
  maxScore: number;
  average: number | null;
}

/** What a student sees about themselves. There is no evaluator field by design. */
export interface StudentResultSummaryDTO {
  projectId: number;
  projectTitle: string;
  teamName: string;
  visibility: ResultsVisibility;
  responseCount: number | null;
  overallAverage: number | null;
  overallPercent: number | null;
  criteria: CriterionResult[];
  comments: string[];
  message: string | null;
  resultsReleasedAt: string;
}

export interface MemberResult {
  studentId: number;
  fullName: string;
  receivedCount: number;
  givenCount: number;
  expectedCount: number;
  overallAverage: number | null;
  overallPercent: number | null;
  criteria: CriterionResult[];
  comments: string[];
}

export interface TeamResults {
  teamId: number;
  teamName: string;
  memberCount: number;
  submittedCount: number;
  expectedCount: number;
  members: MemberResult[];
}

export interface ProjectResults {
  projectId: number;
  projectTitle: string;
  evaluationState: EvaluationState;
  evalEndDate: string;
  teams: TeamResults[];
}