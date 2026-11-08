import { beforeAll, describe, expect, it } from 'vitest';
import * as authApi from './authApi.ts';
import { TOKEN_KEY } from './axiosClient.ts';
import * as evaluationApi from './evaluationApi.ts';
import * as gradeApi from './gradeApi.ts';
import * as projectApi from './projectApi.ts';
import * as resultsApi from './resultsApi.ts';
import type { AuthResponse } from '../types/auth.ts';
import type { Criterion, ScoreValue } from '../types/evaluation.ts';

const INVITE = import.meta.env.VITE_TEST_INVITE_CODE as string | undefined;
const RUN_ID = Date.now();
const DAY = 86400e3;
const TITLE = `IT Grades Project ${RUN_ID}`;
const REASON = 'Adjusted after reviewing the full team context.';

const useToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

const register = (name: string, role: 'STUDENT' | 'INSTRUCTOR'): Promise<AuthResponse> =>
  authApi.register({
    fullName: `IT ${name}`,
    email: `it_${name}_${RUN_ID}@school.edu`,
    password: 'Passw0rd!',
    role,
    inviteCode: role === 'INSTRUCTOR' ? INVITE : undefined,
  });

const expectApiError = async (promise: Promise<unknown>, status: number, code: string): Promise<void> => {
  await expect(promise).rejects.toMatchObject({ response: { status, data: { code } } });
};

describe('Phase 5: attribution view and reason-required grade overrides against the live backend', () => {
  let instructor: AuthResponse;
  let instructor2: AuthResponse;
  let studentA: AuthResponse;
  let studentB: AuthResponse;
  let studentC: AuthResponse;
  let studentD: AuthResponse;
  let projectId = 0;
  let criteria: Criterion[] = [];

  const scoresFrom = (values: number[]): ScoreValue[] =>
    criteria.map((c, i) => ({ criterionId: c.id, score: values[i] }));

  const setWindow = async (startOffsetMs: number, endOffsetMs: number): Promise<void> => {
    useToken(instructor.token);
    await projectApi.updateProject(projectId, {
      title: TITLE,
      description: '',
      evalStartDate: new Date(Date.now() + startOffsetMs).toISOString(),
      evalEndDate: new Date(Date.now() + endOffsetMs).toISOString(),
    });
  };

  beforeAll(async () => {
    if (!INVITE) {
      throw new Error('Set VITE_TEST_INVITE_CODE in frontend/.env.test.local');
    }
    clearToken();
    instructor = await register('p5_instructor', 'INSTRUCTOR');
    instructor2 = await register('p5_instructor2', 'INSTRUCTOR');
    studentA = await register('p5_student_a', 'STUDENT');
    studentB = await register('p5_student_b', 'STUDENT');
    studentC = await register('p5_student_c', 'STUDENT');
    studentD = await register('p5_student_d', 'STUDENT'); // never joins a team

    useToken(instructor.token);
    const project = await projectApi.createProject({
      title: TITLE,
      description: '',
      evalStartDate: new Date(Date.now() - 3600e3).toISOString(),
      evalEndDate: new Date(Date.now() + 7 * DAY).toISOString(),
    });
    projectId = project.id;
    const team = await projectApi.createTeam(projectId, 'Team Alpha');
    await projectApi.addTeamMember(projectId, team.id, studentA.user.id);
    await projectApi.addTeamMember(projectId, team.id, studentB.user.id);
    await projectApi.addTeamMember(projectId, team.id, studentC.user.id);

    useToken(studentA.token);
    criteria = await evaluationApi.getCriteria(projectId);

    // Same 4 evaluations as Phase 4: A->B, C->B (edited), B->A, B->C
    useToken(studentA.token);
    await evaluationApi.createEvaluation({
      projectId, evaluateeId: studentB.user.id, scores: scoresFrom([5, 4, 3, 4]), comment: 'Great communicator.',
    });

    useToken(studentC.token);
    const cb = await evaluationApi.createEvaluation({
      projectId, evaluateeId: studentB.user.id, scores: scoresFrom([1, 1, 1, 1]), comment: 'Needs to start earlier.',
    });
    await evaluationApi.updateEvaluation(cb.id, {
      scores: scoresFrom([3, 2, 3, 2]), comment: 'Needs to start earlier.', version: cb.version,
    });

    useToken(studentB.token);
    await evaluationApi.createEvaluation({
      projectId, evaluateeId: studentA.user.id, scores: scoresFrom([5, 5, 5, 5]), comment: 'Carries the team.',
    });
    await evaluationApi.createEvaluation({
      projectId, evaluateeId: studentC.user.id, scores: scoresFrom([3, 3, 3, 3]), comment: '',
    });
  });

  it('1. locks attribution, overrides and the student grade while the window is OPEN', async () => {
    useToken(instructor.token);
    await expectApiError(gradeApi.getAttribution(projectId), 422, 'ATTRIBUTION_NOT_AVAILABLE');
    await expectApiError(
      gradeApi.setOverride(projectId, studentA.user.id, { overridePercent: 90, reason: REASON }),
      422,
      'EVALUATION_NOT_CLOSED',
    );
    const provisional = await gradeApi.getGradebook(projectId);
    expect(provisional.evaluationState).toBe('OPEN');

    useToken(studentA.token);
    await expectApiError(gradeApi.getMyGrade(projectId), 422, 'RESULTS_NOT_AVAILABLE');
  });

  it('2. reveals exactly who rated whom after the deadline', async () => {
    await setWindow(-7 * DAY, -DAY);

    useToken(instructor.token);
    const attribution = await gradeApi.getAttribution(projectId);
    expect(attribution.evaluationState).toBe('CLOSED');
    expect(attribution.evaluations).toHaveLength(4);

    const find = (from: AuthResponse, to: AuthResponse) =>
      attribution.evaluations.find((e) => e.evaluator.id === from.user.id && e.evaluatee.id === to.user.id);

    const ab = find(studentA, studentB);
    expect(ab?.scores.map((s) => s.score)).toEqual([5, 4, 3, 4]);
    expect(ab?.comment).toBe('Great communicator.');
    expect(ab?.evaluator.fullName).toBe('IT p5_student_a');
    expect(ab?.evaluatee.fullName).toBe('IT p5_student_b');
    expect(ab?.teamName).toBe('Team Alpha');

    const cb = find(studentC, studentB);
    expect(cb?.scores.map((s) => s.score)).toEqual([3, 2, 3, 2]); // the edited values
    expect(cb?.updatedAt).not.toBeNull();

    expect(find(studentB, studentA)?.scores.map((s) => s.score)).toEqual([5, 5, 5, 5]);
    expect(find(studentB, studentC)?.comment).toBeNull();
  });

  it('3. enforces roles, ownership and authentication on every new endpoint', async () => {
    const override = { overridePercent: 90, reason: REASON };

    useToken(studentA.token);
    await expectApiError(gradeApi.getAttribution(projectId), 403, 'FORBIDDEN');
    await expectApiError(gradeApi.getGradebook(projectId), 403, 'FORBIDDEN');
    await expectApiError(gradeApi.setOverride(projectId, studentA.user.id, override), 403, 'FORBIDDEN');
    await expectApiError(gradeApi.getOverrideHistory(projectId, studentA.user.id), 403, 'FORBIDDEN');

    useToken(instructor.token);
    await expectApiError(gradeApi.getMyGrade(projectId), 403, 'FORBIDDEN');

    useToken(studentD.token);
    await expectApiError(gradeApi.getMyGrade(projectId), 403, 'NOT_TEAM_MEMBER');

    useToken(instructor2.token);
    await expectApiError(gradeApi.getAttribution(projectId), 404, 'PROJECT_NOT_FOUND');
    await expectApiError(gradeApi.getGradebook(projectId), 404, 'PROJECT_NOT_FOUND');
    await expectApiError(gradeApi.setOverride(projectId, studentA.user.id, override), 404, 'PROJECT_NOT_FOUND');
    await expectApiError(gradeApi.getOverrideHistory(projectId, studentA.user.id), 404, 'PROJECT_NOT_FOUND');

    clearToken();
    await expectApiError(gradeApi.getAttribution(projectId), 401, 'UNAUTHENTICATED');
    await expectApiError(gradeApi.getGradebook(projectId), 401, 'UNAUTHENTICATED');
  });

  it('4. builds the gradebook from the Phase 4 computed scores', async () => {
    useToken(instructor.token);
    const gradebook = await gradeApi.getGradebook(projectId);
    const byName = Object.fromEntries(gradebook.rows.map((r) => [r.fullName, r]));

    expect(gradebook.evaluationState).toBe('CLOSED');
    expect(byName['IT p5_student_a'].computedPercent).toBe(100);
    expect(byName['IT p5_student_b'].computedPercent).toBe(56.25);
    expect(byName['IT p5_student_c'].computedPercent).toBe(50);

    for (const row of gradebook.rows) {
      expect(row.overridden).toBe(false);
      expect(row.overridePercent).toBeNull();
      expect(row.finalPercent).toBe(row.computedPercent);
      expect(row.overrideReason).toBeNull();
    }
  });

  it('5. rejects invalid overrides and saves nothing', async () => {
    useToken(instructor.token);

    await expectApiError(
      gradeApi.setOverride(projectId, studentA.user.id, { overridePercent: 90, reason: 'short' }),
      400,
      'VALIDATION_FAILED',
    );
    // 11 characters long, but only 1 after trimming: the server must still refuse it
    await expectApiError(
      gradeApi.setOverride(projectId, studentA.user.id, { overridePercent: 90, reason: '          x' }),
      400,
      'REASON_TOO_SHORT',
    );
    await expectApiError(
      gradeApi.setOverride(projectId, studentA.user.id, { overridePercent: 101, reason: REASON }),
      400,
      'VALIDATION_FAILED',
    );
    await expectApiError(
      gradeApi.setOverride(projectId, studentA.user.id, { overridePercent: -1, reason: REASON }),
      400,
      'VALIDATION_FAILED',
    );
    await expectApiError(
      gradeApi.setOverride(projectId, studentD.user.id, { overridePercent: 90, reason: REASON }),
      404,
      'STUDENT_NOT_IN_PROJECT',
    );
    await expectApiError(
      gradeApi.revokeOverride(projectId, studentA.user.id, { reason: REASON }),
      409,
      'NO_ACTIVE_OVERRIDE',
    );

    const history = await gradeApi.getOverrideHistory(projectId, studentA.user.id);
    expect(history).toHaveLength(0);
  });

  it('6. applies an override and shows students only the adjusted flag, never the reason', async () => {
    useToken(instructor.token);
    const saved = await gradeApi.setOverride(projectId, studentA.user.id, { overridePercent: 88.5, reason: REASON });
    expect(saved.action).toBe('SET');
    expect(saved.overridePercent).toBe(88.5);
    expect(saved.computedPercent).toBe(100); // snapshot of the peer score at that moment
    expect(saved.reason).toBe(REASON);
    expect(saved.instructorName).toBe('IT p5_instructor');

    const gradebook = await gradeApi.getGradebook(projectId);
    const a = gradebook.rows.find((r) => r.studentId === studentA.user.id);
    expect(a?.overridden).toBe(true);
    expect(a?.overridePercent).toBe(88.5);
    expect(a?.finalPercent).toBe(88.5);
    expect(a?.computedPercent).toBe(100);
    expect(a?.overrideReason).toBe(REASON);

    // A has too few responses, so Phase 4 hides her results, but the instructor's grade still reaches her
    useToken(studentA.token);
    const grade = await gradeApi.getMyGrade(projectId);
    expect(grade.adjusted).toBe(true);
    expect(grade.finalPercent).toBe(88.5);
    expect(grade.computedPercent).toBeNull();
    expect(Object.keys(grade).sort()).toEqual(
      ['adjusted', 'adjustedAt', 'computedPercent', 'finalPercent', 'projectId'].sort(),
    );
    expect(JSON.stringify(grade)).not.toContain('Adjusted after reviewing');
    expect(JSON.stringify(grade).toLowerCase()).not.toContain('reason');

    const results = await resultsApi.getMyResults(projectId);
    expect(results.visibility).toBe('INSUFFICIENT_RESPONSES');

    // An untouched student is not marked adjusted and sees the Phase 4 number
    useToken(studentB.token);
    const bGrade = await gradeApi.getMyGrade(projectId);
    expect(bGrade.adjusted).toBe(false);
    expect(bGrade.computedPercent).toBe(56.25);
    expect(bGrade.finalPercent).toBe(56.25);
  });

  it('7. keeps an append-only history, newest first, and revoking restores the computed grade', async () => {
    useToken(instructor.token);
    await gradeApi.setOverride(projectId, studentA.user.id, { overridePercent: 70, reason: 'Second adjustment after a meeting.' });
    const revoked = await gradeApi.revokeOverride(projectId, studentA.user.id, { reason: 'Restoring the original peer score.' });
    expect(revoked.action).toBe('REVOKE');
    expect(revoked.overridePercent).toBeNull();

    const history = await gradeApi.getOverrideHistory(projectId, studentA.user.id);
    expect(history.map((h) => h.action)).toEqual(['REVOKE', 'SET', 'SET']);
    expect(history.map((h) => h.overridePercent)).toEqual([null, 70, 88.5]);
    expect(history.every((h) => h.instructorName === 'IT p5_instructor')).toBe(true);

    const gradebook = await gradeApi.getGradebook(projectId);
    const a = gradebook.rows.find((r) => r.studentId === studentA.user.id);
    expect(a?.overridden).toBe(false);
    expect(a?.finalPercent).toBe(100);

    useToken(studentA.token);
    const grade = await gradeApi.getMyGrade(projectId);
    expect(grade.adjusted).toBe(false);
    expect(grade.finalPercent).toBeNull(); // hidden results and no override: nothing to show

    useToken(instructor.token);
    await expectApiError(
      gradeApi.revokeOverride(projectId, studentA.user.id, { reason: REASON }),
      409,
      'NO_ACTIVE_OVERRIDE',
    );
  });

  it('8. re-locks everything when the window is reopened, then 404s after deletion', async () => {
    await setWindow(-3600e3, 8 * DAY);

    useToken(instructor.token);
    await expectApiError(gradeApi.getAttribution(projectId), 422, 'ATTRIBUTION_NOT_AVAILABLE');
    await expectApiError(
      gradeApi.setOverride(projectId, studentA.user.id, { overridePercent: 90, reason: REASON }),
      422,
      'EVALUATION_NOT_CLOSED',
    );

    await projectApi.deleteProject(projectId);
    await expectApiError(gradeApi.getOverrideHistory(projectId, studentA.user.id), 404, 'PROJECT_NOT_FOUND');
  });
});