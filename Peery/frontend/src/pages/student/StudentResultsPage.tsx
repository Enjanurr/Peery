import { ArrowLeft, EyeOff, Lock } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getEvaluationWindow } from '../../api/evaluationApi.ts';
import { getMyGrade } from '../../api/gradeApi.ts';
import { getMyResults } from '../../api/resultsApi.ts';
import CommentList from '../../components/CommentList.tsx';
import CriterionBreakdown from '../../components/CriterionBreakdown.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import DashboardLayout from '../../layouts/DashboardLayout.tsx';
import type { EvaluationWindow } from '../../types/evaluation.ts';
import type { StudentGrade } from '../../types/grades.ts';
import type { StudentResultSummaryDTO } from '../../types/results.ts';
import { formatDateTime } from '../../utils/dates.ts';
import { formatPercentExact } from '../../utils/grades.ts';
import { isResultsLocked } from '../../utils/resultsErrors.ts';
import { formatPercent, formatScore } from '../../utils/scores.ts';

type LoadState =
  | { kind: 'ready'; summary: StudentResultSummaryDTO; grade: StudentGrade }
  | { kind: 'locked'; evalWindow: EvaluationWindow };

/** A 422 RESULTS_NOT_AVAILABLE is an expected state, not an error: show the window instead. */
async function loadResults(projectId: number): Promise<LoadState> {
  try {
    const [summary, grade] = await Promise.all([getMyResults(projectId), getMyGrade(projectId)]);
    return { kind: 'ready', summary, grade };
  } catch (err) {
    if (isResultsLocked(err)) {
      return { kind: 'locked', evalWindow: await getEvaluationWindow(projectId) };
    }
    throw err;
  }
}

function lockedMessage(evalWindow: EvaluationWindow): string {
  if (evalWindow.state === 'NOT_OPEN') {
    return `Evaluation opens on ${formatDateTime(evalWindow.evalStartDate)}. Results are released after it closes on ${formatDateTime(evalWindow.evalEndDate)}.`;
  }
  return `Results are released after the evaluation deadline on ${formatDateTime(evalWindow.evalEndDate)}.`;
}

export default function StudentResultsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);

  const { data, loading, error } = useAsyncData(() => loadResults(id), [id]);

  if (Number.isNaN(id)) {
    return <Navigate to="/student/projects" replace />;
  }

  const back = (
    <Link
      to="/student/projects"
      className="mt-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
    >
      <ArrowLeft className="h-4 w-4" />
      My projects
    </Link>
  );

  if (loading && !data) {
    return (
      <DashboardLayout title="My results">
        {back}
        <p className="mt-4 text-slate-400">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="My results">
        {back}
        <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error || 'Could not load your results.'}
        </p>
      </DashboardLayout>
    );
  }

  if (data.kind === 'locked') {
    return (
      <DashboardLayout title="My results">
        {back}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-700/40 px-4 py-3 text-sm text-slate-300">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{lockedMessage(data.evalWindow)}</p>
        </div>
      </DashboardLayout>
    );
  }

  const { summary, grade } = data;
  const visible = summary.visibility === 'AVAILABLE';

  return (
    <DashboardLayout title="My results">
      {back}

      {grade.finalPercent !== null && (
        <section className="mt-4 rounded-xl bg-slate-800 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Final grade</p>
              <p className="text-3xl font-semibold tabular-nums">{formatPercentExact(grade.finalPercent)}</p>
            </div>
            {grade.adjusted && (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                Adjusted by your instructor
              </span>
            )}
          </div>
          {grade.adjusted && grade.computedPercent !== null && (
            <p className="mt-2 text-xs text-slate-400">
              Peer-evaluation score before adjustment: {formatPercentExact(grade.computedPercent)}
            </p>
          )}
        </section>
      )}

      <section className="mt-4 rounded-xl bg-slate-800 p-5">
        <p className="text-sm text-slate-400">
          {summary.projectTitle} · {summary.teamName}
        </p>

        {visible ? (
          <>
            <div className="mt-3 flex items-end gap-8">
              <div>
                <p className="text-4xl font-semibold tabular-nums">{formatScore(summary.overallAverage)}</p>
                <p className="text-sm text-slate-400">overall average</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{formatPercent(summary.overallPercent)}</p>
                <p className="text-sm text-slate-400">of the maximum</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Based on {summary.responseCount} anonymous evaluations from your teammates.
            </p>
          </>
        ) : (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-slate-700/40 px-3 py-3 text-sm text-slate-300">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{summary.message}</p>
          </div>
        )}
      </section>

      {visible && (
        <>
          <section className="mt-4 rounded-xl bg-slate-800 p-5">
            <h2 className="mb-4 text-lg font-semibold">By criterion</h2>
            <CriterionBreakdown criteria={summary.criteria} />
          </section>

          <section className="mt-4 rounded-xl bg-slate-800 p-5">
            <CommentList comments={summary.comments} />
          </section>
        </>
      )}
    </DashboardLayout>
  );
}