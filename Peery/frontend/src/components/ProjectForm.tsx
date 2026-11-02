import { Loader2 } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { Project, ProjectPayload } from '../types/project.ts';
import { localInputToIso, toLocalInputValue } from '../utils/dates.ts';
import { parseApiError } from '../utils/errors.ts';
import FormField from './FormField.tsx';

interface ProjectFormProps {
  initial?: Pick<Project, 'title' | 'description' | 'evalStartDate' | 'evalEndDate'>;
  submitLabel: string;
  /** Throw to show an error in the form; resolve to signal success. */
  onSubmit: (payload: ProjectPayload) => Promise<void>;
  onCancel?: () => void;
}

interface FormState {
  title: string;
  description: string;
  evalStartDate: string;
  evalEndDate: string;
}

type FieldErrors = Record<string, string>;

export default function ProjectForm({ initial, submitLabel, onSubmit, onCancel }: ProjectFormProps) {
  const [form, setForm] = useState<FormState>(() => ({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    evalStartDate: initial ? toLocalInputValue(initial.evalStartDate) : '',
    evalEndDate: initial ? toLocalInputValue(initial.evalEndDate) : '',
  }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    else if (form.title.trim().length > 150) errors.title = 'Title must be at most 150 characters';
    if (!form.evalStartDate) errors.evalStartDate = 'Start date is required';
    if (!form.evalEndDate) errors.evalEndDate = 'Deadline is required';
    if (
      form.evalStartDate &&
      form.evalEndDate &&
      new Date(form.evalEndDate) <= new Date(form.evalStartDate)
    ) {
      errors.evalEndDate = 'Deadline must be after the start date';
    }
    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    const clientErrors = validate();
    setFieldErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        evalStartDate: localInputToIso(form.evalStartDate),
        evalEndDate: localInputToIso(form.evalEndDate),
      });
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
      <FormField
        label="Project title"
        id="title"
        value={form.title}
        onChange={handleChange}
        error={fieldErrors.title}
        maxLength={150}
        required
      />

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
        {fieldErrors.description && (
          <p className="mt-1 text-sm text-rose-400">{fieldErrors.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Evaluation opens"
          id="evalStartDate"
          type="datetime-local"
          value={form.evalStartDate}
          onChange={handleChange}
          error={fieldErrors.evalStartDate}
          required
        />
        <FormField
          label="Evaluation deadline"
          id="evalEndDate"
          type="datetime-local"
          value={form.evalEndDate}
          onChange={handleChange}
          error={fieldErrors.evalEndDate}
          required
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg bg-slate-700 px-4 py-2 hover:bg-slate-600 disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}