import { getApiErrorCode } from './evaluationErrors.ts';

/** True when the server says results are not released yet (window still open or not started). */
export const isResultsLocked = (error: unknown): boolean =>
  getApiErrorCode(error) === 'RESULTS_NOT_AVAILABLE';