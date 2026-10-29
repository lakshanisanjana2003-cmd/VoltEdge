import { Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailsPage from "@/pages/ProjectDetailsPage";
import ClientsPage from "@/pages/ClientsPage";
import ProfessionalsPage from "@/pages/ProfessionalsPage";
import DrawingsPage from "@/pages/DrawingsPage";
import SiteVisitsPage from "@/pages/SiteVisitsPage";
import TestingPage from "@/pages/TestingPage";
import SettingsPage from "@/pages/SettingsPage";
import UsersPage from "@/pages/UsersPage";
import NotFoundPage from "@/pages/NotFoundPage";

// Every page except the sign-in page needs a saved login token.
function RequireLogin() {
  return getToken() ? <AppShell /> : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<RequireLogin />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/professionals" element={<ProfessionalsPage />} />
        <Route path="/drawings" element={<DrawingsPage />} />
        <Route path="/site-visits" element={<SiteVisitsPage />} />
        <Route path="/testing" element={<TestingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}