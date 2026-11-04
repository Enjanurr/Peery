import { beforeAll, describe, expect, it } from 'vitest';
import * as authApi from './authApi.ts';
import { TOKEN_KEY } from './axiosClient.ts';
import * as evaluationApi from './evaluationApi.ts';
import * as projectApi from './projectApi.ts';
import type { AuthResponse } from '../types/auth.ts';
import type { Criterion, ScoreValue } from '../types/evaluation.ts';

const INVITE = import.meta.env.VITE_TEST_INVITE_CODE as string | undefined;
const RUN_ID = Date.now();
const PROJECT_TITLE = `IT Evaluation Project ${RUN_ID}`;

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

describe('Phase 3: peer evaluation API layer against the live backend', () => {
  let instructor: AuthResponse;
  let studentA: AuthResponse;
  let studentB: AuthResponse;
  let studentC: AuthResponse;
  let projectId = 0;
  let criteria: Criterion[] = [];
  let evaluationId = 0;
  let version = 0;

  const scoresOf = (value: number): ScoreValue[] =>
    criteria.map((c) => ({ criterionId: c.id, score: value }));

  beforeAll(async () => {
    if (!INVITE) {
      throw new Error('Set VITE_TEST_INVITE_CODE in frontend/.env.test.local');
    }
    clearToken();
    instructor = await register(`p3_instructor`, 'INSTRUCTOR');
    studentA = await register(`p3_student_a`, 'STUDENT');
    studentB = await register(`p3_student_b`, 'STUDENT');
    studentC = await register(`p3_student_c`, 'STUDENT'); // never joins the team

    useToken(instructor.token);
    const project = await projectApi.createProject({
      title: PROJECT_TITLE,
      description: '',
      evalStartDate: new Date(Date.now() - 3600e3).toISOString(),
      evalEndDate: new Date(Date.now() + 7 * 86400e3).toISOString(),
    });
    projectId = project.id;
    const team = await projectApi.createTeam(projectId, 'Team Alpha');
    await projectApi.addTeamMember(projectId, team.id, studentA.user.id);
    await projectApi.addTeamMember(projectId, team.id, studentB.user.id);
  });

  it('1. reads an OPEN window and the seeded default rubric', async () => {
    useToken(studentA.token);

    const evalWindow = await evaluationApi.getEvaluationWindow(projectId);
    expect(evalWindow.state).toBe('OPEN');

    criteria = await evaluationApi.getCriteria(projectId);
    expect(criteria).toHaveLength(4);
    expect(criteria.every((c) => c.minScore === 1 && c.maxScore === 5)).toBe(true);
  });

  it('2. lists the teammate as NOT_STARTED with 0/1 progress and never lists the caller', async () => {
    useToken(studentA.token);

    const pending = await evaluationApi.getPendingEvaluations(projectId);
    expect(pending.completedCount).toBe(0);
    expect(pending.totalCount).toBe(1);
    expect(pending.teammates.map((t) => t.evaluateeId)).toEqual([studentB.user.id]);
    expect(pending.teammates[0].status).toBe('NOT_STARTED');
  });

  it('3. submits an evaluation, flips pending to SUBMITTED, and exposes no evaluator identity', async () => {
    useToken(studentA.token);

    const created = await evaluationApi.createEvaluation({
      projectId,
      evaluateeId: studentB.user.id,
      scores: scoresOf(4),
      comment: 'Reliable and communicative.',
    });
    evaluationId = created.id;
    version = created.version;
    expect(created.editable).toBe(true);
    expect(created.scores).toHaveLength(4);
    expect(JSON.stringify(created).toLowerCase()).not.toContain('evaluator');

    const pending = await evaluationApi.getPendingEvaluations(projectId);
    expect(pending.completedCount).toBe(1);
    expect(pending.teammates[0].status).toBe('SUBMITTED');
    expect(pending.teammates[0].evaluationId).toBe(evaluationId);

    const mine = await evaluationApi.listMyEvaluations(projectId);
    expect(mine.map((e) => e.id)).toEqual([evaluationId]);
    expect(JSON.stringify(mine).toLowerCase()).not.toContain('evaluator');
  });

  it('4. rejects bad input with the machine-readable codes the UI maps to messages', async () => {
    useToken(studentA.token);

    await expect(
      evaluationApi.createEvaluation({
        projectId,
        evaluateeId: studentB.user.id,
        scores: scoresOf(4),
        comment: '',
      }),
    ).rejects.toMatchObject({ response: { status: 409, data: { code: 'DUPLICATE_EVALUATION' } } });

    await expect(
      evaluationApi.createEvaluation({
        projectId,
        evaluateeId: studentB.user.id,
        scores: scoresOf(6),
        comment: '',
      }),
    ).rejects.toMatchObject({ response: { status: 400, data: { code: 'INVALID_SCORES' } } });

    await expect(
      evaluationApi.createEvaluation({
        projectId,
        evaluateeId: studentA.user.id,
        scores: scoresOf(4),
        comment: '',
      }),
    ).rejects.toMatchObject({ response: { status: 400, data: { code: 'SELF_EVALUATION' } } });

    await expect(
      evaluationApi.createEvaluation({
        projectId,
        evaluateeId: studentC.user.id,
        scores: scoresOf(4),
        comment: '',
      }),
    ).rejects.toMatchObject({ response: { status: 403, data: { code: 'NOT_A_TEAMMATE' } } });

    useToken(studentC.token);
    await expect(
      evaluationApi.createEvaluation({
        projectId,
        evaluateeId: studentB.user.id,
        scores: scoresOf(4),
        comment: '',
      }),
    ).rejects.toMatchObject({ response: { status: 403, data: { code: 'NOT_TEAM_MEMBER' } } });
  });

  it('5. edits with the current version, and rejects a stale one', async () => {
    useToken(studentA.token);

    const updated = await evaluationApi.updateEvaluation(evaluationId, {
      scores: scoresOf(5),
      comment: 'Updated after the final demo.',
      version,
    });
    expect(updated.scores.every((s) => s.score === 5)).toBe(true);
    expect(updated.version).toBe(version + 1);

    await expect(
      evaluationApi.updateEvaluation(evaluationId, { scores: scoresOf(3), comment: '', version }),
    ).rejects.toMatchObject({ response: { status: 409, data: { code: 'STALE_VERSION' } } });

    version = updated.version;
  });

  it('6. hides evaluations from other students and blocks the wrong role', async () => {
    useToken(studentB.token);
    await expect(evaluationApi.getEvaluation(evaluationId)).rejects.toMatchObject({
      response: { status: 404, data: { code: 'EVALUATION_NOT_FOUND' } },
    });
    expect(await evaluationApi.listMyEvaluations(projectId)).toHaveLength(0);

    useToken(instructor.token);
    await expect(evaluationApi.getPendingEvaluations(projectId)).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  it('7. locks editing after the deadline, keeps reading allowed, then cleans up', async () => {
    useToken(instructor.token);
    await projectApi.updateProject(projectId, {
      title: PROJECT_TITLE,
      description: '',
      evalStartDate: new Date(Date.now() - 7 * 86400e3).toISOString(),
      evalEndDate: new Date(Date.now() - 86400e3).toISOString(),
    });

    useToken(studentA.token);
    await expect(
      evaluationApi.updateEvaluation(evaluationId, { scores: scoresOf(4), comment: 'Too late', version }),
    ).rejects.toMatchObject({
      response: { status: 422, data: { code: 'EVALUATION_WINDOW_CLOSED' } },
    });

    const closed = await evaluationApi.getEvaluationWindow(projectId);
    expect(closed.state).toBe('CLOSED');
    const readOnly = await evaluationApi.getEvaluation(evaluationId);
    expect(readOnly.editable).toBe(false);

    useToken(instructor.token);
    await projectApi.deleteProject(projectId);
  });
});