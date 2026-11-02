import RbacProbe from "../../components/RbacProbe.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import DashboardLayout from "../../layouts/DashboardLayout.tsx";
import { Link } from 'react-router-dom';
export default function StudentDashboard() {
  const { user } = useAuth();
  return (
    <DashboardLayout title="Student Dashboard">
      <p className="mt-2 text-slate-400">
        Welcome, {user?.fullName}. Your projects will appear here.
      </p>
      <Link
        to="/student/projects"
        className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500"
      >
        My projects
      </Link>
      <RbacProbe />
    </DashboardLayout>
  );
}
