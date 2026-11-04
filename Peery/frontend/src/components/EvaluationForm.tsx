import { Loader2 } from 'lucide-react';
import { useEvaluationForm, COMMENT_MAX } from '../hooks/useEvaluationForm.ts';
import type {
  Criterion,
  Evaluation,
  EvaluationFormValues,
  EvaluationWindow,
} from '../types/evaluation.ts';
import { formatDateTime } from '../utils/dates.ts';
import RatingInput from './RatingInput.tsx';

interface EvaluationFormProps {
  evaluateeName: string;
  criteria: Criterion[];
  initial: Evaluation | null;
  evalWindow: EvaluationWindow;
  onSubmit: (values: EvaluationFormValues) => Promise<void>;
}

export default function EvaluationForm({
  evaluateeName,
  criteria,
  initial,
  evalWindow,
  onSubmit,
}: EvaluationFormProps) {
  const locked = evalWindow.state !== 'OPEN';
  const {
    scores,
    setScore,
    comment,
    setComment,
    missing,
    commentTooLong,
    canSubmit,
    error,
    submitting,
    submit,
  } = useEvaluationForm({ criteria, initial, disabled: locked, onSubmit });

  const handleConfirm = (): void => {
    if (!canSubmit) return;
    const confirmed = window.confirm(
      `${initial ? 'Save changes to' : 'Submit'} your evaluation of ${evaluateeName}? ` +
        `You can edit it until ${formatDateTime(evalWindow.evalEndDate)}.`,
    );
    if (confirmed) void submit();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleConfirm();
      }}
      className="space-y-6 rounded-xl bg-slate-800 p-5"
      noValidate
    >
      {criteria.map((criterion) => (
        <RatingInput
          key={criterion.id}
          label={criterion.name}
          description={criterion.description}
          min={criterion.minScore}
          max={criterion.maxScore}
          value={scores[criterion.id] ?? null}
          disabled={locked || submitting}
          onChange={(value) => setScore(criterion.id, value)}
        />
      ))}

      <div>
        <label htmlFor="comment" className="mb-1 block text-sm font-medium text-slate-200">
          Comments <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          readOnly={locked}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Anything specific you'd like to say about their contribution?"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 read-only:opacity-70"
        />
        <p className={`mt-1 text-right text-xs ${commentTooLong ? 'text-rose-400' : 'text-slate-400'}`}>
          {comment.length}/{COMMENT_MAX}
        </p>
      </div>

      {!locked && missing.length > 0 && (
        <p className="text-sm text-slate-400">
          {missing.length} {missing.length === 1 ? 'criterion still needs' : 'criteria still need'} a rating.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      {!locked && (
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {initial ? 'Save changes' : 'Submit evaluation'}
        </button>
      )}
    </form>
  );
}