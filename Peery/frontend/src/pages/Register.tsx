import { GraduationCap, Loader2 } from 'lucide-react';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import type { Role } from '../types/auth.ts';
import { parseApiError } from '../utils/errors.ts';
import { ROLES, homePathFor } from '../utils/roles.ts';

interface RegisterFormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  inviteCode: string;
}

type FieldErrors = Record<string, string>;

const EMPTY_FORM: RegisterFormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: ROLES.STUDENT,
  inviteCode: '',
};

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterFormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (user) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Quick client-side checks; the backend remains the source of truth.
  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (form.role === ROLES.INSTRUCTOR && !form.inviteCode.trim()) {
      errors.inviteCode = 'Invite code is required for instructors';
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
      const created = await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        inviteCode: form.role === ROLES.INSTRUCTOR ? form.inviteCode : undefined,
      });
      navigate(homePathFor(created.role), { replace: true });
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
      setFieldErrors(parsed.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-8">
      <div className="w-full max-w-sm rounded-xl bg-slate-800 p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-indigo-400" />
          <h1 className="text-xl font-semibold">Create your account</h1>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
          <FormField
            label="Full name"
            id="fullName"
            autoComplete="name"
            value={form.fullName}
            onChange={handleChange}
            error={fieldErrors.fullName}
            required
          />
          <FormField
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
            required
          />
          <FormField
            label="Password"
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
            required
          />
          <FormField
            label="Confirm password"
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            required
          />

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-slate-300">
              I am a
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value={ROLES.STUDENT}>Student</option>
              <option value={ROLES.INSTRUCTOR}>Instructor</option>
            </select>
          </div>

          {form.role === ROLES.INSTRUCTOR && (
            <FormField
              label="Instructor invite code"
              id="inviteCode"
              value={form.inviteCode}
              onChange={handleChange}
              error={fieldErrors.inviteCode}
              required
            />
          )}

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
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}