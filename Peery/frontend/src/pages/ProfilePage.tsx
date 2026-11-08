import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProfile } from '../api/profileApi.ts';
import ChangePasswordForm from '../components/ChangePasswordForm.tsx';
import ProfileForm from '../components/ProfileForm.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import DashboardLayout from '../layouts/DashboardLayout.tsx';
import { homePathFor } from '../utils/roles.ts';

export default function ProfilePage() {
  const { data, loading, error } = useAsyncData(getProfile, []);

  if (loading && !data) {
    return (
      <DashboardLayout title="My profile">
        <p className="mt-4 text-slate-400">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout title="My profile">
        <p role="alert" className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error || 'Could not load your profile.'}
        </p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My profile">
      <Link
        to={homePathFor(data.role)}
        className="mt-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </Link>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ProfileForm profile={data} />
        <ChangePasswordForm />
      </div>
    </DashboardLayout>
  );
}