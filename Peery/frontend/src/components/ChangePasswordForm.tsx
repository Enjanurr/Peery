import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { changePassword } from '../api/profileApi.ts';
import { getProfileErrorMessage, passwordProblem } from '../utils/profileErrors.ts';
import FormField from './FormField.tsx';

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const validate = (): string => {
    if (!currentPassword) return 'Enter your current password';
    const problem = passwordProblem(newPassword);
    if (problem) return problem;
    if (newPassword === currentPassword) return 'The new password must be different from the current one';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSuccess('');

    const problem = validate();
    setError(problem);
    if (problem) return;

    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed. Other devices stay signed in until their session expires.');
    } catch (err) {
      setError(getProfileErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-xl bg-slate-800 p-5" noValidate>
      <div>
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="text-sm text-slate-400">Use 8 or more characters.</p>
      </div>

      <FormField
        label="Current password"
        id="cp-current"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
      />
      <FormField
        label="New password"
        id="cp-new"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <FormField
        label="Confirm new password"
        id="cp-confirm"
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
      {success && (
        <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500 disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? 'Changing…' : 'Change password'}
      </button>
    </form>
  );
}