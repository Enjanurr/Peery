import type { EvaluationState } from '../types/project.ts';
import { getEvaluationState } from '../utils/dates.ts';

interface StatusBadgeProps {
  start: string;
  end: string;
}

const STYLES: Record<EvaluationState, string> = {
  NOT_OPEN: 'bg-slate-600/40 text-slate-300',
  OPEN: 'bg-emerald-500/20 text-emerald-300',
  CLOSED: 'bg-rose-500/20 text-rose-300',
};

const LABELS: Record<EvaluationState, string> = {
  NOT_OPEN: 'Not open yet',
  OPEN: 'Evaluation open',
  CLOSED: 'Closed',
};

export default function StatusBadge({ start, end }: StatusBadgeProps) {
  const state = getEvaluationState(start, end);
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[state]}`}>
      {LABELS[state]}
    </span>
  );
}