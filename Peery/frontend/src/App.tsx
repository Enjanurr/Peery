import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { useAuth } from './hooks/useAuth.ts';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import InstructorDashboard from './pages/instructor/InstructorDashboard.tsx';
import Login from './pages/Login.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import Register from './pages/Register.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import StudentDashboard from './pages/student/StudentDashboard.tsx';
import InstructorAttributionPage from './pages/instructor/InstructorAttributionPage.tsx';
import InstructorGradebookPage from './pages/instructor/InstructorGradebookPage.tsx';
import InstructorProjectDetailPage from './pages/instructor/InstructorProjectDetailPage.tsx';
import InstructorProjectsPage from './pages/instructor/InstructorProjectsPage.tsx';
import InstructorResultsPage from './pages/instructor/InstructorResultsPage.tsx';
import EvaluateTeammatePage from './pages/student/EvaluateTeammatePage.tsx';
import EvaluationDashboardPage from './pages/student/EvaluationDashboardPage.tsx';
import StudentProjectsPage from './pages/student/StudentProjectsPage.tsx';
import StudentResultsPage from './pages/student/StudentResultsPage.tsx';
import { ROLES, homePathFor } from './utils/roles.ts';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homePathFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.INSTRUCTOR]} />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/projects" element={<StudentProjectsPage />} />
        <Route path="/student/projects/:projectId/evaluations" element={<EvaluationDashboardPage />} />
        <Route
          path="/student/projects/:projectId/evaluations/:evaluateeId"
          element={<EvaluateTeammatePage />}
        />
        <Route path="/student/projects/:projectId/results" element={<StudentResultsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]} />}>
        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route path="/instructor/projects" element={<InstructorProjectsPage />} />
        <Route path="/instructor/projects/:projectId" element={<InstructorProjectDetailPage />} />
        <Route path="/instructor/projects/:projectId/results" element={<InstructorResultsPage />} />
        <Route path="/instructor/projects/:projectId/attribution" element={<InstructorAttributionPage />} />
        <Route path="/instructor/projects/:projectId/grades" element={<InstructorGradebookPage />} />
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}