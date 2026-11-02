import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { useAuth } from "./hooks/useAuth.ts";
import InstructorDashboard from "./pages/instructor/InstructorDashboard.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import StudentDashboard from "./pages/student/StudentDashboard.tsx";
import { ROLES, homePathFor } from "./utils/roles.ts";
import InstructorProjectDetailPage from "./pages/instructor/InstructorProjectDetailPage.tsx";
import InstructorProjectsPage from "./pages/instructor/InstructorProjectsPage.tsx";
import StudentProjectsPage from "./pages/student/StudentProjectsPage.tsx";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homePathFor(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/projects" element={<StudentProjectsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]} />}>
        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route
          path="/instructor/projects"
          element={<InstructorProjectsPage />}
        />
        <Route
          path="/instructor/projects/:projectId"
          element={<InstructorProjectDetailPage />}
        />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
