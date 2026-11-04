import { useCallback, useState } from 'react';
import type { Criterion, Evaluation, EvaluationFormValues, ScoreValue } from '../types/evaluation.ts';
import { getEvaluationErrorMessage } from '../utils/evaluationErrors.ts';

export const COMMENT_MAX = 1000;

interface UseEvaluationFormArgs {
  criteria: Criterion[];
  initial: Evaluation | null;
  disabled: boolean;
  onSubmit: (values: EvaluationFormValues) => Promise<void>;
}

export function useEvaluationForm({ criteria, initial, disabled, onSubmit }: UseEvaluationFormArgs) {
  const [scores, setScores] = useState<Record<number, number>>(() => {
    const start: Record<number, number> = {};
    initial?.scores.forEach((s) => {
      start[s.criterionId] = s.score;
    });
    return start;
  });
  const [comment, setComment] = useState<string>(initial?.comment ?? '');
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const setScore = useCallback((criterionId: number, value: number): void => {
    setScores((prev) => ({ ...prev, [criterionId]: value }));
  }, []);

  const missing = criteria.filter((c) => scores[c.id] === undefined);
  const commentTooLong = comment.length > COMMENT_MAX;
  const canSubmit = !disabled && !submitting && missing.length === 0 && !commentTooLong;

  const submit = useCallback(async (): Promise<void> => {
    if (!canSubmit) return;

    const entries: ScoreValue[] = [];
    for (const criterion of criteria) {
      const value = scores[criterion.id];
      if (value === undefined) return;
      entries.push({ criterionId: criterion.id, score: value });
    }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ scores: entries, comment: comment.trim() });
    } catch (err) {
      setError(getEvaluationErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, criteria, scores, comment, onSubmit]);

  return { scores, setScore, comment, setComment, missing, commentTooLong, canSubmit, error, submitting, submit };
}