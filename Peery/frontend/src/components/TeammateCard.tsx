import { CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EvaluationStatus, PendingTeammate } from '../types/evaluation.ts';
import type { EvaluationState } from '../types/project.ts';

interface TeammateCardProps {
  teammate: PendingTeammate;
  projectId: number;
  windowState: EvaluationState;
}

interface CardAction {
  label: string;
  enabled: boolean;
}

function getAction(status: EvaluationStatus, windowState: EvaluationState): CardAction {
  if (windowState === 'OPEN') {
    return status === 'SUBMITTED'
      ? { label: 'Edit', enabled: true }
      : { label: 'Evaluate', enabled: true };
  }
  if (status === 'SUBMITTED') {
    return { label: 'View', enabled: true };
  }
  return windowState === 'NOT_OPEN'
    ? { label: 'Not open yet', enabled: false }
    : { label: 'Closed', enabled: false };
}

export default function TeammateCard({ teammate, projectId, windowState }: TeammateCardProps) {
  const submitted = teammate.status === 'SUBMITTED';
  const action = getAction(teammate.status, windowState);

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-slate-800 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {submitted ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
        ) : (
          <Circle className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-100">{teammate.evaluateeName}</p>
          <p className="text-xs text-slate-400">{submitted ? 'Submitted' : 'Not started'}</p>
        </div>
      </div>

      {action.enabled ? (
        <Link
          to={`/student/projects/${projectId}/evaluations/${teammate.evaluateeId}`}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium hover:bg-indigo-500"
        >
          {action.label}
        </Link>
      ) : (
        <span className="shrink-0 rounded-lg bg-slate-700/60 px-3 py-1.5 text-sm text-slate-400">
          {action.label}
        </span>
      )}
    </li>
  );
}