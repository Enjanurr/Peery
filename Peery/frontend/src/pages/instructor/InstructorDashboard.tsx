import RbacProbe from "../../components/RbacProbe.tsx";
import { useAuth } from "../../hooks/useAuth.ts";
import DashboardLayout from "../../layouts/DashboardLayout.tsx";
import { Link } from 'react-router-dom'
export default function InstructorDashboard() {
  const { user } = useAuth();
  return (
    <DashboardLayout title="Instructor Dashboard">
      <p className="mt-2 text-slate-400">
        Welcome, {user?.fullName}. Your courses will appear here.
      </p>
      <Link
        to="/instructor/projects"
        className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500"
      >
        Manage projects
      </Link>
      <RbacProbe />
    </DashboardLayout>
  );
}
