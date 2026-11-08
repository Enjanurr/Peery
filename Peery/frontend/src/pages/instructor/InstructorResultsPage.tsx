import { ArrowLeft, Clock } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getProjectResults } from '../../api/resultsApi.ts';
import CommentList from '../../components/CommentList.tsx';
import CriterionBreakdown from '../../components/CriterionBreakdown.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import DashboardLayout from '../../layouts/DashboardLayout.tsx';
import type { TeamResults } from '../../types/results.ts';
import { formatDateTime } from '../../utils/dates.ts';
import { formatPercent, formatScore } from '../../utils/scores.ts';

function TeamSection({ team }: { team: TeamResults }) {
  const percent =
    team.expectedCount === 0 ? 0 : Math.round((team.submittedCount / team.expectedCount) * 100);

  return (
    <section className="rounded-xl bg-slate-800 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{team.teamName}</h2>
        <p className="text-sm text-slate-400">
          {team.submittedCount} of {team.expectedCount} evaluations submitted
        </p>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700"
        role="progressbar"
        aria-label={`${team.teamName} completion`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
      </div>

      <ul className="mt-4 space-y-2">
        {team.members.map((member) => (
          <li key={member.studentId}>
            <details className="rounded-lg bg-slate-900 px-4 py-3">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-slate-100">{member.fullName}</span>
                <span className="text-sm text-slate-400">
                  received {member.receivedCount}/{member.expectedCount} · gave {member.givenCount}/
                  {member.expectedCount} · avg {formatScore(member.overallAverage)} (
                  {formatPercent(member.overallPercent)})
                </span>
              </summary>

              <div className="mt-4 space-y-5">
                <CriterionBreakdown criteria={member.criteria} />
                <CommentList comments={member.comments} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function InstructorResultsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);

  const { data, loading, error } = useAsyncData(() => getProjectResults(id), [id]);

  if (Number.isNaN(id)) {
    return <Navigate to="/instructor/projects" replace />;
  }

  const nav = (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      <Link
        to={`/instructor/projects/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Project
      </Link>
      <div className="flex gap-2">
        <Link
          to={`/instructor/projects/${id}/attribution`}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
        >
          Attribution
        </Link>
        <Link
          to={`/instructor/projects/${id}/grades`}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium hover:bg-indigo-500"
        >
          Grades
        </Link>
      </div>
    </div>
  );

  if (loading && !data) {
    return (
      <DashboardLayout title="Project results">
        {nav}
        <p className="mt-4 text-slate-400">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Project results">
        {nav}
        <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error || 'Could not load the results.'}
        </p>
      </DashboardLayout>
    );
  }

  const closed = data.evaluationState === 'CLOSED';

  return (
    <DashboardLayout title={`Results: ${data.projectTitle}`}>
      {nav}

      <div
        className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
          closed ? 'bg-slate-700/40 text-slate-300' : 'bg-amber-500/10 text-amber-300'
        }`}
      >
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {closed
            ? `Evaluation closed on ${formatDateTime(data.evalEndDate)}. Students can now see their own results; anyone with too few responses sees nothing.`
            : 'Evaluation has not closed yet. These figures are provisional and students cannot see their results.'}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {data.teams.length === 0 ? (
          <p className="text-slate-400">This project has no teams with members yet.</p>
        ) : (
          data.teams.map((team) => <TeamSection key={team.teamId} team={team} />)
        )}
      </div>
    </DashboardLayout>
  );
}