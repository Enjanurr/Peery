import axios from 'axios';
import type { ApiErrorBody } from '../types/auth.ts';
import { parseApiError } from './errors.ts';

const FRIENDLY_MESSAGES: Record<string, string> = {
  DUPLICATE_EVALUATION:
    'You have already evaluated this teammate. Go back and open it again to edit your evaluation.',
  STALE_VERSION: 'This evaluation was changed elsewhere. Reload the page to see the latest version.',
  EVALUATION_WINDOW_CLOSED: 'The evaluation deadline has passed. This evaluation can no longer be changed.',
  EVALUATION_NOT_OPEN: 'Evaluation has not opened yet for this project.',
  NOT_TEAM_MEMBER: 'You are not on a team in this project.',
  NOT_A_TEAMMATE: 'You can only evaluate members of your own team.',
  SELF_EVALUATION: 'You cannot evaluate yourself.',
};

/** The machine-readable `code` from the backend error body, if there is one. */
export function getApiErrorCode(error: unknown): string | null {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.code ?? null;
  }
  return null;
}

export function getEvaluationErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  if (code && FRIENDLY_MESSAGES[code]) {
    return FRIENDLY_MESSAGES[code];
  }
  // INVALID_SCORES and the rest already carry a readable message from the server.
  return parseApiError(error).message;
}