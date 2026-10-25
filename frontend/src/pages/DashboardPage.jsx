import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Activity, CheckCircle2, CalendarClock, AlertTriangle } from "lucide-react";
import { listProjects } from "@/lib/api";
import { onlyDate, summarizeProjects } from "@/lib/projectHelpers";
import { PageHeader } from "@/components/PageHeader";
import { StatCard, Panel } from "@/components/StatCard";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  if (error) return <p className="text-sm text-destructive">Could not load data: {error}</p>;

  const today = new Date().toISOString().slice(0, 10);
  const summary = summarizeProjects(projects, today);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Projects" value={summary.total} icon={FolderKanban} />
        <StatCard label="Ongoing Projects" value={summary.ongoing} icon={Activity} />
        <StatCard label="Planned Projects" value={summary.planned} icon={CalendarClock} />
        <StatCard label="Completed Projects" value={summary.completed} icon={CheckCircle2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Upcoming Project Deadlines (next 60 days)">
          {summary.upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deadlines in the next 60 days.</p>
          ) : (
            <ul className="divide-y">
              {summary.upcoming.map((project) => (
                <li key={project._id} className="flex items-center justify-between py-2 text-sm">
                  <Link to={`/projects/${project._id}`} className="hover:underline">
                    <span className="font-mono text-xs text-muted-foreground">{project.project_code}</span> {project.name}
                  </Link>
                  <span className="flex items-center gap-1 whitespace-nowrap font-mono text-xs">
                    <CalendarClock className="h-3 w-3" />
                    {onlyDate(project.expected_completion_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Notifications and Reminders">
          {summary.overdue.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
          ) : (
            <ul className="space-y-2">
              {summary.overdue.map((project) => (
                <li key={project._id} className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                  <span>
                    <Link to={`/projects/${project._id}`} className="font-medium hover:underline">{project.name}</Link>{" "}
                    passed its expected completion date ({onlyDate(project.expected_completion_date)}).
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
