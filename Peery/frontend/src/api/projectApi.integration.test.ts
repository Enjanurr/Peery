import { beforeAll, describe, expect, it } from 'vitest';
import * as authApi from './authApi.ts';
import { TOKEN_KEY } from './axiosClient.ts';
import * as projectApi from './projectApi.ts';
import type { AuthResponse } from '../types/auth.ts';
import type { ProjectPayload } from '../types/project.ts';

const INVITE = import.meta.env.VITE_TEST_INVITE_CODE as string | undefined;
const RUN_ID = Date.now();

const useToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

const newProject = (title: string): ProjectPayload => ({
  title,
  description: 'integration test',
  evalStartDate: new Date(Date.now() - 3600e3).toISOString(),
  evalEndDate: new Date(Date.now() + 7 * 86400e3).toISOString(),
});

describe('Phase 2: frontend API layer against the live backend', () => {
  let instructor: AuthResponse;
  let studentA: AuthResponse;
  let studentB: AuthResponse;
  let projectId = 0;
  let teamId = 0;

  beforeAll(async () => {
    if (!INVITE) {
      throw new Error('Set VITE_TEST_INVITE_CODE in frontend/.env.test.local');
    }
    clearToken();
    instructor = await authApi.register({
      fullName: 'IT Instructor',
      email: `it_instructor_${RUN_ID}@school.edu`,
      password: 'Passw0rd!',
      role: 'INSTRUCTOR',
      inviteCode: INVITE,
    });
    studentA = await authApi.register({
      fullName: 'IT Student A',
      email: `it_student_a_${RUN_ID}@school.edu`,
      password: 'Passw0rd!',
      role: 'STUDENT',
    });
    studentB = await authApi.register({
      fullName: 'IT Student B',
      email: `it_student_b_${RUN_ID}@school.edu`,
      password: 'Passw0rd!',
      role: 'STUDENT',
    });
  });

  it('1. attaches the instructor JWT, creates a project and lists it', async () => {
    useToken(instructor.token);

    const created = await projectApi.createProject(newProject(`IT Project ${RUN_ID}`));
    projectId = created.id;
    expect(created.title).toBe(`IT Project ${RUN_ID}`);
    expect(created.teamCount).toBe(0);

    const list = await projectApi.listInstructorProjects();
    expect(list.some((p) => p.id === projectId)).toBe(true);
  });

  it('2. surfaces backend validation errors in the shape the UI expects', async () => {
    useToken(instructor.token);

    await expect(
      projectApi.createProject({ ...newProject('Bad dates'), evalEndDate: '2000-01-01T00:00:00.000Z' }),
    ).rejects.toMatchObject({
      response: { status: 400, data: { code: 'INVALID_DATE_RANGE' } },
    });
  });

  it('3. creates a team, assigns two students and reads them back in the project detail', async () => {
    useToken(instructor.token);

    const team = await projectApi.createTeam(projectId, 'Team Alpha');
    teamId = team.id;
    expect(team.members).toHaveLength(0);

    await projectApi.addTeamMember(projectId, teamId, studentA.user.id);
    const updated = await projectApi.addTeamMember(projectId, teamId, studentB.user.id);
    expect(updated.members).toHaveLength(2);

    const detail = await projectApi.getProject(projectId);
    expect(detail.teamCount).toBe(1);
    expect(detail.studentCount).toBe(2);
    expect(detail.teams[0].members.map((m) => m.id).sort()).toEqual(
      [studentA.user.id, studentB.user.id].sort(),
    );

    // one team per student per project
    await expect(
      projectApi.addTeamMember(projectId, teamId, studentA.user.id),
    ).rejects.toMatchObject({
      response: { status: 409, data: { code: 'STUDENT_ALREADY_ASSIGNED' } },
    });
  });

  it('4. a student sees their team and teammates, and not themselves', async () => {
    useToken(studentA.token);

    const mine = await projectApi.listMyProjects();
    const project = mine.find((p) => p.id === projectId);
    expect(project?.team?.name).toBe('Team Alpha');
    expect(project?.team?.teammates.map((m) => m.id)).toEqual([studentB.user.id]);

    // after removal the other student has no projects
    useToken(instructor.token);
    await projectApi.removeTeamMember(projectId, teamId, studentB.user.id);
    useToken(studentB.token);
    expect(await projectApi.listMyProjects()).toHaveLength(0);
  });

  it('5. enforces roles and authentication end to end, then cleans up', async () => {
    // student token on an instructor endpoint -> 403
    useToken(studentA.token);
    await expect(projectApi.listInstructorProjects()).rejects.toMatchObject({
      response: { status: 403 },
    });

    // no token -> 401
    clearToken();
    await expect(projectApi.listInstructorProjects()).rejects.toMatchObject({
      response: { status: 401 },
    });

    // clean up: delete the project, then it is gone
    useToken(instructor.token);
    await projectApi.deleteProject(projectId);
    await expect(projectApi.getProject(projectId)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});