import { parseApiError } from './errors.ts';
import { getApiErrorCode } from './evaluationErrors.ts';

const FRIENDLY_MESSAGES: Record<string, string> = {
  REASON_TOO_SHORT: 'Please give a reason of at least 10 characters (spaces do not count).',
  EVALUATION_NOT_CLOSED: 'Grades can only be overridden after the evaluation deadline has passed.',
  NO_ACTIVE_OVERRIDE: 'This student has no active override to revoke.',
  STUDENT_NOT_IN_PROJECT: 'That student is not on a team in this project.',
  ATTRIBUTION_NOT_AVAILABLE: 'Attribution is available only after the evaluation deadline.',
};

export const isAttributionLocked = (error: unknown): boolean =>
  getApiErrorCode(error) === 'ATTRIBUTION_NOT_AVAILABLE';

export function getGradeErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  if (code && FRIENDLY_MESSAGES[code]) {
    return FRIENDLY_MESSAGES[code];
  }
  const parsed = parseApiError(error);
  const details = Object.values(parsed.fieldErrors ?? {});
  return details.length > 0 ? details.join(' ') : parsed.message;
}