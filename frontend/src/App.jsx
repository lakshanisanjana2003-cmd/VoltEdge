import { Navigate, Route, Routes } from "react-router-dom";
import { getToken } from "@/lib/auth";
import { PLANNED_PAGES } from "@/lib/constants";
import { AppShell } from "@/components/AppShell";
import { PlannedModule } from "@/components/PlannedModule";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailsPage from "@/pages/ProjectDetailsPage";
import ClientsPage from "@/pages/ClientsPage";
import ProfessionalsPage from "@/pages/ProfessionalsPage";
import SettingsPage from "@/pages/SettingsPage";
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
        <Route path="/settings" element={<SettingsPage />} />
        {PLANNED_PAGES.map((page) => (
          <Route key={page.path} path={page.path} element={<PlannedModule title={page.title} items={page.items} />} />
        ))}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
