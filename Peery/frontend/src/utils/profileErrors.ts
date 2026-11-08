import { parseApiError } from './errors.ts';
import { getApiErrorCode } from './evaluationErrors.ts';

const FRIENDLY_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  CURRENT_PASSWORD_REQUIRED: 'Enter your current password to change your email.',
  INVALID_CURRENT_PASSWORD: 'Your current password is incorrect.',
  PASSWORD_UNCHANGED: 'The new password must be different from the current one.',
  PASSWORD_TOO_LONG: 'That password is too long (72 bytes maximum).',
  FIELD_NOT_FOR_ROLE: 'Some of those fields do not apply to your account type.',
  INVALID_RESET_TOKEN: 'This reset link is invalid or has expired. Request a new one.',
};

export const isInvalidResetToken = (error: unknown): boolean =>
  getApiErrorCode(error) === 'INVALID_RESET_TOKEN';

export function getProfileErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  if (code && FRIENDLY_MESSAGES[code]) {
    return FRIENDLY_MESSAGES[code];
  }
  const parsed = parseApiError(error);
  const details = Object.values(parsed.fieldErrors ?? {});
  return details.length > 0 ? details.join(' ') : parsed.message;
}

/** Mirrors the server rules: 8 or more characters, at most 72 bytes. Returns null when fine. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (new TextEncoder().encode(password).length > 72) return 'Password is too long (72 bytes maximum)';
  return null;
}