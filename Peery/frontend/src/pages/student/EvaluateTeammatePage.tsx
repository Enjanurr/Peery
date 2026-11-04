import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  createEvaluation,
  getCriteria,
  getEvaluation,
  getEvaluationWindow,
  getPendingEvaluations,
  updateEvaluation,
} from '../../api/evaluationApi.ts';
import DeadlineBanner from '../../components/DeadlineBanner.tsx';
import EvaluationForm from '../../components/EvaluationForm.tsx';
import { useAsyncData } from '../../hooks/useAsyncData.ts';
import DashboardLayout from '../../layouts/DashboardLayout.tsx';
import type {
  Criterion,
  Evaluation,
  EvaluationFormValues,
  EvaluationWindow,
  PendingTeammate,
} from '../../types/evaluation.ts';

interface PageData {
  evalWindow: EvaluationWindow;
  criteria: Criterion[];
  teammate: PendingTeammate | null;
  evaluation: Evaluation | null;
}

async function loadPageData(projectId: number, evaluateeId: number): Promise<PageData> {
  const [evalWindow, criteria, pending] = await Promise.all([
    getEvaluationWindow(projectId),
    getCriteria(projectId),
    getPendingEvaluations(projectId),
  ]);

  const teammate = pending.teammates.find((t) => t.evaluateeId === evaluateeId) ?? null;
  const evaluationId = teammate ? teammate.evaluationId : null;
  const evaluation = evaluationId !== null ? await getEvaluation(evaluationId) : null;

  return { evalWindow, criteria, teammate, evaluation };
}

export default function EvaluateTeammatePage() {
  const params = useParams<{ projectId: string; evaluateeId: string }>();
  const projectId = Number(params.projectId);
  const evaluateeId = Number(params.evaluateeId);
  const navigate = useNavigate();

  const { data, loading, error } = useAsyncData(
    () => loadPageData(projectId, evaluateeId),
    [projectId, evaluateeId],
  );

  if (Number.isNaN(projectId) || Number.isNaN(evaluateeId)) {
    return <Navigate to="/student/projects" replace />;
  }

  const dashboardPath = `/student/projects/${projectId}/evaluations`;
  const back = (
    <Link
      to={dashboardPath}
      className="mt-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
    >
      <ArrowLeft className="h-4 w-4" />
      All teammates
    </Link>
  );

  if (loading && !data) {
    return (
      <DashboardLayout title="Evaluate teammate">
        {back}
        <p className="mt-4 text-slate-400">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="Evaluate teammate">
        {back}
        <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error || 'Could not load this evaluation.'}
        </p>
      </DashboardLayout>
    );
  }

  const { evalWindow, criteria, teammate, evaluation } = data;

  if (!teammate) {
    return (
      <DashboardLayout title="Evaluate teammate">
        {back}
        <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          That person is not on your team, so you can't evaluate them.
        </p>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (values: EvaluationFormValues): Promise<void> => {
    if (evaluation) {
      await updateEvaluation(evaluation.id, { ...values, version: evaluation.version });
    } else {
      await createEvaluation({ projectId, evaluateeId, ...values });
    }
    navigate(dashboardPath);
  };

  return (
    <DashboardLayout title={`Evaluate ${teammate.evaluateeName}`}>
      {back}

      <div className="mt-4 space-y-4">
        <DeadlineBanner evalWindow={evalWindow} />
        <EvaluationForm
          key={evaluation?.id ?? 'new'}
          evaluateeName={teammate.evaluateeName}
          criteria={criteria}
          initial={evaluation}
          evalWindow={evalWindow}
          onSubmit={handleSubmit}
        />
      </div>
    </DashboardLayout>
  );
}