import { GraduationCap, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/profileApi.ts';
import FormField from '../components/FormField.tsx';
import { getProfileErrorMessage, isInvalidResetToken, passwordProblem } from '../utils/profileErrors.ts';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [linkDead, setLinkDead] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    const problem = passwordProblem(newPassword);
    if (problem) {
      setError(problem);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword });
      setDone(true);
    } catch (err) {
      setError(getProfileErrorMessage(err));
      setLinkDead(isInvalidResetToken(err));
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (content: React.ReactNode) => (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-xl bg-slate-800 p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-indigo-400" />
          <h1 className="text-xl font-semibold">Choose a new password</h1>
        </div>
        {content}
      </div>
    </div>
  );

  if (!token) {
    return shell(
      <div className="space-y-4">
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          This reset link is missing its token. Open the link from your email again, or request a new one.
        </p>
        <Link to="/forgot-password" className="inline-block text-sm text-indigo-400 hover:underline">
          Request a new link
        </Link>
      </div>,
    );
  }

  if (done) {
    return shell(
      <div className="space-y-4">
        <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Your password has been changed.
        </p>
        <Link
          to="/login"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          Sign in
        </Link>
      </div>,
    );
  }

  return shell(
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
      <FormField
        label="New password"
        id="reset-new"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <FormField
        label="Confirm new password"
        id="reset-confirm"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      {error && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}
      {linkDead && (
        <Link to="/forgot-password" className="inline-block text-sm text-indigo-400 hover:underline">
          Request a new link
        </Link>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? 'Saving…' : 'Set new password'}
      </button>
    </form>,
  );
}