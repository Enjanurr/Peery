import RbacProbe from '../components/RbacProbe.tsx';
import { useAuth } from '../hooks/useAuth.ts';
import DashboardLayout from '../layouts/DashboardLayout.tsx';

export default function InstructorDashboard() {
  const { user } = useAuth();
  return (
    <DashboardLayout title="Instructor Dashboard">
      <p className="mt-2 text-slate-400">
        Welcome, {user?.fullName}. Your courses will appear here.
      </p>
      <RbacProbe />
    </DashboardLayout>
  );
}