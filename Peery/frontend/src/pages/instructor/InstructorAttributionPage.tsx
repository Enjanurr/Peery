import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getAttribution } from '../../api/gradeApi.ts';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import DashboardLayout from '../../layouts/DashboardLayout.tsx';
import type { AttributedEvaluation, AttributionResponse } from '../../types/grades.ts';
import { formatDateTime } from '../../utils/dates.ts';
import { isAttributionLocked } from '../../utils/gradeErrors.ts';

type LoadState = { kind: 'ready'; attribution: AttributionResponse } | { kind: 'locked' };

/** A 422 ATTRIBUTION_NOT_AVAILABLE is an expected state, not an error. */
async function loadAttribution(projectId: number): Promise<LoadState> {
  try {
    return { kind: 'ready', attribution: await getAttribution(projectId) };
  } catch (err) {
    if (isAttributionLocked(err)) return { kind: 'locked' };
    throw err;
  }
}

function EvaluationCard({ evaluation }: { evaluation: AttributedEvaluation }) {
  return (
    <li className="rounded-lg bg-slate-900 px-4 py-3">
      <p className="font-medium text-slate-100">
        {evaluation.evaluator.fullName} <span className="text-slate-500">→</span> {evaluation.evaluatee.fullName}
      </p>

      <ul className="mt-2 flex flex-wrap gap-2">
        {evaluation.scores.map((score) => (
          <li
            key={score.criterionId}
            className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
          >
            {score.criterionName} <span className="font-semibold text-slate-100">{score.score}</span>
          </li>
        ))}
      </ul>

      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
        {evaluation.comment ?? <span className="italic text-slate-500">No comment</span>}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        Submitted {formatDateTime(evaluation.submittedAt)}
        {evaluation.updatedAt && <> · edited {formatDateTime(evaluation.updatedAt)}</>}
      </p>
    </li>
  );
}

export default function InstructorAttributionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);

  const { data, loading, error } = useAsyncData(() => loadAttribution(id), [id]);
  const [filter, setFilter] = useState<string>('');

  if (Number.isNaN(id)) {
    return <Navigate to="/instructor/projects" replace />;
  }

  const back = (
    <Link
      to={`/instructor/projects/${id}/results`}
      className="mt-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
    >
      <ArrowLeft className="h-4 w-4" />
      Results
    </Link>
  );

  if (loading && !data) {
    return (
      <DashboardLayout title="Attribution">
        {back}
        <p className="mt-4 text-slate-400">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Attribution">
        {back}
        <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error || 'Could not load attribution.'}
        </p>
      </DashboardLayout>
    );
  }

  if (data.kind === 'locked') {
    return (
      <DashboardLayout title="Attribution">
        {back}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-700/40 px-4 py-3 text-sm text-slate-300">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Who rated whom is revealed only after the evaluation deadline has passed.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { attribution } = data;
  const needle = filter.trim().toLowerCase();
  const visible = attribution.evaluations.filter(
    (e) =>
      needle === '' ||
      e.evaluator.fullName.toLowerCase().includes(needle) ||
      e.evaluatee.fullName.toLowerCase().includes(needle),
  );

  const byTeam = new Map<string, AttributedEvaluation[]>();
  for (const evaluation of visible) {
    const list = byTeam.get(evaluation.teamName) ?? [];
    list.push(evaluation);
    byTeam.set(evaluation.teamName, list);
  }

  return (
    <DashboardLayout title={`Attribution: ${attribution.projectTitle}`}>
      {back}

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Confidential. Students are told their ratings are anonymous, so do not share this page. Views of this
          page are logged.
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor="attribution-filter" className="sr-only">
          Filter by student name
        </label>
        <input
          id="attribution-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by student name"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 sm:max-w-sm"
        />
      </div>

      {visible.length === 0 ? (
        <p className="mt-4 text-slate-400">
          {attribution.evaluations.length === 0 ? 'No evaluations were submitted.' : 'No evaluations match that name.'}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {[...byTeam.entries()].map(([teamName, evaluations]) => (
            <section key={teamName} className="rounded-xl bg-slate-800 p-5">
              <h2 className="text-lg font-semibold">
                {teamName}{' '}
                <span className="text-sm font-normal text-slate-400">({evaluations.length} evaluations)</span>
              </h2>
              <ul className="mt-3 space-y-2">
                {evaluations.map((evaluation) => (
                  <EvaluationCard key={evaluation.evaluationId} evaluation={evaluation} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}