import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { updateProfile } from '../api/profileApi.ts';
import { useAuth } from '../hooks/useAuth.ts';
import type { Profile, UpdateProfilePayload } from '../types/profile.ts';
import { getProfileErrorMessage } from '../utils/profileErrors.ts';
import FormField from './FormField.tsx';

interface ProfileFormProps {
  profile: Profile;
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const { logout } = useAuth();
  const isStudent = profile.role === 'STUDENT';

  const [fullName, setFullName] = useState<string>(profile.fullName);
  const [email, setEmail] = useState<string>(profile.email);
  const [studentNumber, setStudentNumber] = useState<string>(profile.studentNumber ?? '');
  const [program, setProgram] = useState<string>(profile.program ?? '');
  const [employeeCode, setEmployeeCode] = useState<string>(profile.employeeCode ?? '');
  const [department, setDepartment] = useState<string>(profile.department ?? '');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const emailChanged = email.trim().toLowerCase() !== profile.email;

  const validate = (): string => {
    if (!fullName.trim()) return 'Full name is required';
    if (fullName.trim().length > 100) return 'Full name must be at most 100 characters';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Enter a valid email address';
    if (emailChanged && !currentPassword) return 'Enter your current password to change your email';
    return '';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSuccess('');

    const problem = validate();
    setError(problem);
    if (problem) return;

    const payload: UpdateProfilePayload = {
      fullName: fullName.trim(),
      email: email.trim(),
      ...(isStudent
        ? { studentNumber: studentNumber.trim(), program: program.trim() }
        : { employeeCode: employeeCode.trim(), department: department.trim() }),
      ...(emailChanged ? { currentPassword } : {}),
    };

    setSaving(true);
    try {
      const result = await updateProfile(payload);

      if (result.reauthRequired) {
        // The email is the login identity, so the old session no longer matches. Sign in again.
        setSuccess('Email updated. For your security you will be signed out now. Sign in again with your new email.');
        window.setTimeout(() => {
          void logout();
        }, 2500);
      } else {
        setSuccess('Profile saved.');
        setCurrentPassword('');
        if (payload.fullName !== profile.fullName) {
          // The header and dashboards read the name from the signed-in session, so refresh it.
          window.setTimeout(() => window.location.reload(), 900);
        }
      }
    } catch (err) {
      setError(getProfileErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-xl bg-slate-800 p-5" noValidate>
      <div>
        <h2 className="text-lg font-semibold">Account details</h2>
        <p className="text-sm text-slate-400">
          Signed in as {profile.role === 'STUDENT' ? 'a student' : 'an instructor'}.
        </p>
      </div>

      <FormField
        label="Full name"
        id="profile-fullName"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />

      <FormField
        label="Email"
        id="profile-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {isStudent ? (
        <>
          <FormField
            label="Student number (optional)"
            id="profile-studentNumber"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
          />
          <FormField
            label="Program / course (optional)"
            id="profile-program"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          />
        </>
      ) : (
        <>
          <div>
            <FormField
              label="Instructor / employee code (optional)"
              id="profile-employeeCode"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">
              Your own staff ID. This is separate from the registration invite code, which is never shown here.
            </p>
          </div>
          <FormField
            label="Department (optional)"
            id="profile-department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </>
      )}

      {emailChanged && (
        <div className="rounded-lg bg-amber-500/10 p-3">
          <p className="mb-2 text-sm text-amber-300">
            Changing your email signs you out. Confirm it's you by entering your current password.
          </p>
          <FormField
            label="Current password"
            id="profile-currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
      )}

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
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}