import { Clock, Lock } from 'lucide-react';
import type { EvaluationWindow } from '../types/evaluation.ts';
import { formatRemaining } from '../utils/countdown.ts';
import { formatDateTime } from '../utils/dates.ts';

interface DeadlineBannerProps {
  evalWindow: EvaluationWindow;
}

export default function DeadlineBanner({ evalWindow }: DeadlineBannerProps) {
  if (evalWindow.state === 'OPEN') {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Evaluation is open and closes in{' '}
          <strong>{formatRemaining(evalWindow.evalEndDate, evalWindow.serverTime)}</strong> (
          {formatDateTime(evalWindow.evalEndDate)}). You can edit your evaluations until then.
        </p>
      </div>
    );
  }

  if (evalWindow.state === 'NOT_OPEN') {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-slate-700/40 px-4 py-3 text-sm text-slate-300">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Evaluation opens on {formatDateTime(evalWindow.evalStartDate)}. You can't submit yet.</p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        Evaluation closed on {formatDateTime(evalWindow.evalEndDate)}. Your submissions are now
        read-only.
      </p>
    </div>
  );
}