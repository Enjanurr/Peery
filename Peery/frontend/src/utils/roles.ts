import type { Role } from '../types/auth.ts';

export const ROLES = {
  STUDENT: 'STUDENT',
  INSTRUCTOR: 'INSTRUCTOR',
} as const;

export function homePathFor(role: Role): string {
  return role === ROLES.INSTRUCTOR ? '/instructor' : '/student';
}