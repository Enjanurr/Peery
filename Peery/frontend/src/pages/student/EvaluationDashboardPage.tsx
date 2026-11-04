import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getEvaluationWindow, getPendingEvaluations } from '../../api/evaluationApi.ts';
import DeadlineBanner from '../../components/DeadlineBanner.tsx';
import TeammateCard from '../../components/TeammateCard.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import DashboardLayout from '../../layouts/DashboardLayout.tsx';

export default function EvaluationDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = Number(projectId);

  const { data, loading, error } = useAsyncData(
    () => Promise.all([getEvaluationWindow(id), getPendingEvaluations(id)]),
    [id],
  );

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
      <DashboardLayout title="Peer evaluation">
        {back}
        <p className="mt-4 text-slate-400">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Peer evaluation">
        {back}
        <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error || 'Could not load your evaluations.'}
        </p>
      </DashboardLayout>
    );
  }

  const [evalWindow, pending] = data;
  const percent =
    pending.totalCount === 0 ? 0 : Math.round((pending.completedCount / pending.totalCount) * 100);

  return (
    <DashboardLayout title="Peer evaluation">
      {back}

      <div className="mt-4">
        <DeadlineBanner evalWindow={evalWindow} />
      </div>

      <section className="mt-6 rounded-xl bg-slate-800 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-200">Your progress</span>
          <span className="text-slate-400">
            {pending.completedCount} of {pending.totalCount} teammates evaluated
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </section>

      <h2 className="mt-6 text-lg font-semibold">Your teammates</h2>
      {pending.teammates.length === 0 ? (
        <p className="mt-2 text-slate-400">You have no teammates to evaluate yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {pending.teammates.map((teammate) => (
            <TeammateCard
              key={teammate.evaluateeId}
              teammate={teammate}
              projectId={id}
              windowState={evalWindow.state}
            />
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}