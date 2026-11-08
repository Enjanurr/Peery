import { Loader2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { getGradeErrorMessage } from '../utils/gradeErrors.ts';
import { formatPercentExact } from '../utils/grades.ts';

export const REASON_MIN = 10;
export const REASON_MAX = 1000;

export interface OverrideFormValues {
  overridePercent: number;
  reason: string;
}

interface OverrideDialogProps {
  mode: 'set' | 'revoke';
  studentName: string;
  computedPercent: number | null;
  currentOverride: number | null;
  onSubmit: (values: OverrideFormValues) => Promise<void>;
  onClose: () => void;
}

export default function OverrideDialog({
  mode,
  studentName,
  computedPercent,
  currentOverride,
  onSubmit,
  onClose,
}: OverrideDialogProps) {
  const initialPercent = currentOverride ?? computedPercent;
  const [percent, setPercent] = useState<string>(initialPercent === null ? '' : String(initialPercent));
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const trimmedReason = reason.trim();
  const reasonOk = trimmedReason.length >= REASON_MIN && reason.length <= REASON_MAX;
  const parsedPercent = Number(percent);
  const percentOk =
    mode === 'revoke' ||
    (/^\d{1,3}(\.\d{1,2})?$/.test(percent.trim()) && parsedPercent >= 0 && parsedPercent <= 100);
  const canSubmit = reasonOk && percentOk && !submitting;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ overridePercent: mode === 'set' ? parsedPercent : 0, reason: trimmedReason });
      // The parent closes the dialog on success.
    } catch (err) {
      setError(getGradeErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="override-title"
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-md space-y-4 rounded-xl bg-slate-800 p-5 shadow-xl"
        noValidate
      >
        <div>
          <h2 id="override-title" className="text-lg font-semibold">
            {mode === 'set' ? 'Override grade' : 'Revoke override'}: {studentName}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Peer-evaluation score: {formatPercentExact(computedPercent)}
            {currentOverride !== null && <> · Current override: {formatPercentExact(currentOverride)}</>}
          </p>
        </div>

        {mode === 'set' && (
          <div>
            <label htmlFor="override-percent" className="mb-1 block text-sm font-medium text-slate-200">
              Final grade (%)
            </label>
            <input
              id="override-percent"
              inputMode="decimal"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
            {!percentOk && (
              <p className="mt-1 text-xs text-rose-400">Enter a number from 0 to 100 with at most 2 decimals.</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="override-reason" className="mb-1 block text-sm font-medium text-slate-200">
            Reason <span className="font-normal text-slate-400">(required, kept in the audit history)</span>
          </label>
          <textarea
            id="override-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus={mode === 'revoke'}
            placeholder="Explain why this grade is being changed"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <p
            className={`mt-1 text-right text-xs ${
              reasonOk || reason.length === 0 ? 'text-slate-400' : 'text-rose-400'
            }`}
          >
            {trimmedReason.length}/{REASON_MIN} minimum · {reason.length}/{REASON_MAX}
          </p>
        </div>

        <p className="text-xs text-slate-400">
          Students never see this reason. They only see that their grade was adjusted.
        </p>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'set' ? 'Save override' : 'Revoke override'}
          </button>
        </div>
      </form>
    </div>
  );
}