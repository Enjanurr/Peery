import type { EvaluationState } from '../types/project.ts';

const pad = (n: number): string => String(n).padStart(2, '0');

/** ISO string -> value for <input type="datetime-local"> in the user's local time. */
export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local value (local time) -> ISO UTC string for the API. */
export function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Display only. The backend remains the source of truth for deadline enforcement. */
export function getEvaluationState(
  startIso: string,
  endIso: string,
  now: Date = new Date(),
): EvaluationState {
  if (now < new Date(startIso)) return 'NOT_OPEN';
  if (now > new Date(endIso)) return 'CLOSED';
  return 'OPEN';
}