import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  addTeamMember,
  createTeam,
  deleteProject,
  deleteTeam,
  getProject,
  listStudents,
  removeTeamMember,
  updateProject,
} from '../../api/projectApi.ts';
import ProjectForm from '../../components/ProjectForm.tsx';
import StatusBadge from '../../components/StatusBadge.tsx';
import TeamPanel from '../../components/TeamPanel.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import DashboardLayout from '../../layouts/DashboardLayout.tsx';
import type { ProjectPayload } from '../../types/project.ts';
import { formatDateTime } from '../../utils/dates.ts';
import { parseApiError } from '../../utils/errors.ts';

export default function InstructorProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);
  const navigate = useNavigate();

  const { data, loading, error, reload } = useAsyncData(
    () => Promise.all([getProject(id), listStudents()]),
    [id],
  );

  const [editing, setEditing] = useState<boolean>(false);
  const [teamName, setTeamName] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>('');

  if (Number.isNaN(id)) {
    return <Navigate to="/instructor/projects" replace />;
  }

  /** Runs a mutation, refreshes the page data, and reports success. */
  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setActionError('');
    try {
      await action();
      reload();
      return true;
    } catch (err) {
      setActionError(parseApiError(err).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (payload: ProjectPayload): Promise<void> => {
    await updateProject(id, payload);
    setEditing(false);
    reload();
  };

  const handleDelete = async (): Promise<void> => {
    if (!window.confirm('Delete this project and all of its teams? This cannot be undone.')) return;
    setBusy(true);
    setActionError('');
    try {
      await deleteProject(id);
      navigate('/instructor/projects', { replace: true });
    } catch (err) {
      setActionError(parseApiError(err).message);
      setBusy(false);
    }
  };

  const handleAddTeam = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const name = teamName.trim();
    if (!name) return;
    const ok = await run(() => createTeam(id, name));
    if (ok) setTeamName('');
  };

  const handleDeleteTeam = (teamId: number): void => {
    if (!window.confirm('Delete this team? Its members become unassigned.')) return;
    void run(() => deleteTeam(id, teamId));
  };

  if (loading && !data) {
    return (
      <DashboardLayout title="Project">
        <p className="mt-4 text-slate-400">Loading project…</p>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Project">
        <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error || 'Project not found.'}
        </p>
        <Link to="/instructor/projects" className="mt-4 inline-block text-indigo-400 hover:underline">
          Back to projects
        </Link>
      </DashboardLayout>
    );
  }

  const [project, students] = data;
  const assignedIds = new Set(project.teams.flatMap((team) => team.members.map((m) => m.id)));
  const availableStudents = students.filter((student) => !assignedIds.has(student.id));

  return (
    <DashboardLayout title={project.title}>
      <Link
        to="/instructor/projects"
        className="mt-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        All projects
      </Link>

      {actionError && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {actionError}
        </p>
      )}

      {/* Details */}
      <section className="mt-4 rounded-xl bg-slate-800 p-4">
        {editing ? (
          <ProjectForm
            initial={project}
            submitLabel="Save changes"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <StatusBadge start={project.evalStartDate} end={project.evalEndDate} />
                {project.description && (
                  <p className="mt-2 text-sm text-slate-300">{project.description}</p>
                )}
                <p className="mt-2 text-sm text-slate-400">
                  Opens {formatDateTime(project.evalStartDate)} · Deadline{' '}
                  {formatDateTime(project.evalEndDate)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => setEditing(true)}
                  disabled={busy}
                  className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600 disabled:opacity-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => void handleDelete()}
                  disabled={busy}
                  className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-rose-300 hover:bg-slate-600 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Teams */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Teams <span className="text-sm font-normal text-slate-400">({project.teams.length})</span>
        </h2>
        <p className="text-sm text-slate-400">{availableStudents.length} unassigned students</p>
      </div>

      <form onSubmit={(e) => void handleAddTeam(e)} className="mt-3 flex gap-2">
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="New team name"
          maxLength={100}
          aria-label="New team name"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
        <button
          type="submit"
          disabled={busy || !teamName.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500 disabled:opacity-50"
        >
          Add team
        </button>
      </form>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {project.teams.length === 0 && (
          <p className="text-slate-400">No teams yet. Add one above.</p>
        )}
        {project.teams.map((team) => (
          <TeamPanel
            key={team.id}
            team={team}
            availableStudents={availableStudents}
            busy={busy}
            onAddMember={(teamId, studentId) => void run(() => addTeamMember(id, teamId, studentId))}
            onRemoveMember={(teamId, studentId) =>
              void run(() => removeTeamMember(id, teamId, studentId))
            }
            onDeleteTeam={handleDeleteTeam}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}