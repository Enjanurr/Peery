import { GraduationCap, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/profileApi.ts';
import FormField from '../components/FormField.tsx';
import { getProfileErrorMessage } from '../utils/profileErrors.ts';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const result = await forgotPassword(email.trim());
      setMessage(result.message);
    } catch (err) {
      setError(getProfileErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-xl bg-slate-800 p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-indigo-400" />
          <h1 className="text-xl font-semibold">Reset your password</h1>
        </div>

        {message ? (
          <div className="space-y-4">
            <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {message}
            </p>
            <p className="text-sm text-slate-400">The link works once and expires in 30 minutes.</p>
            <Link to="/login" className="inline-block text-sm text-indigo-400 hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
            <p className="text-sm text-slate-400">
              Enter the email you registered with and we'll send you a link to choose a new password.
            </p>
            <FormField
              label="Email"
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>

            <p className="text-center text-sm text-slate-400">
              <Link to="/login" className="text-indigo-400 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}