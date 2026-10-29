import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Pencil } from "lucide-react";
import { deleteProject, getProject } from "@/lib/api";
import { nameWithId, onlyDate } from "@/lib/projectHelpers";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { ProjectForm } from "@/components/ProjectForm";
import { Panel } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Project tabs  are not built yet.
const NOT_BUILT_TABS = [
  { value: "design", label: "Design & Calculations" },
  { value: "boq", label: "Estimate & BOQ" },
  { value: "specs", label: "Specifications" },
  { value: "circuits", label: "Boards & Circuits" },
  { value: "sld", label: "SLDs" },
];

// One label + value
function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{value || "Not recorded"}</dd>
    </div>
  );
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  async function loadProject() {
    try {
      setProject(await getProject(projectId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function handleDelete() {
    try {
      await deleteProject(projectId);
      toast.success("Project deleted");
      navigate("/projects");
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading project…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!project) return <p className="text-sm">Project not found.</p>;

  return (
    <div>
      <Link to="/projects" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>
      <PageHeader
        title={project.name}
        subtitle={project.project_code}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
            <ConfirmDelete itemName={project.name} onConfirm={handleDelete} />
          </>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {NOT_BUILT_TABS.map((tab) => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Panel title="Project information">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Info label="Client" value={nameWithId(project.client)} />
                <Info label="Building type" value={project.building_type} />
                <Info label="Location" value={project.location} />
                <Info label="Main contractor" value={project.main_contractor} />
                <Info label="Project stage" value={project.project_stage} />
                <Info label="Consulting organisation" value={project.consulting_organization} />
                <div className="sm:col-span-2"><Info label="Project duration" value={project.project_duration} /></div>
                <div className="sm:col-span-2"><Info label="Description and scope" value={project.description} /></div>
                <div className="sm:col-span-2"><Info label="Notes" value={project.notes} /></div>
              </dl>
            </Panel>
            <section className="mt-6">
              <h2 className="mb-3 font-semibold">Completed activity history</h2>
              {project.activity_history ? (
                <ul className="list-disc space-y-3 pl-5 text-sm">
                  {project.activity_history.split("\n").filter((line) => line.trim()).map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No completed activities recorded.</p>
              )}
            </section>
          </div>
          <div className="space-y-6">
            <Panel title="Status">
              <div className="flex gap-2">
                <StatusBadge value={project.status} />
                {project.priority !== "Not recorded" && <StatusBadge value={project.priority} />}
              </div>
              <dl className="mt-4 space-y-3 font-mono">
                <Info label="Start date" value={onlyDate(project.start_date)} />
                <Info label="Expected completion" value={onlyDate(project.expected_completion_date)} />
                <Info label="Actual completion" value={onlyDate(project.actual_completion_date)} />
              </dl>
            </Panel>
            <Panel title="Assigned professionals">
              <dl className="space-y-3">
                <Info label="Design engineer" value={nameWithId(project.design_engineer)} />
                <Info label="Draughtsman" value={nameWithId(project.draughtsman)} />
              </dl>
            </Panel>
            <Panel title="Recent activity">
              <p className="text-sm">Created {new Date(project.created_at).toLocaleString()}</p>
              <p className="text-sm">Last updated {new Date(project.updated_at).toLocaleString()}</p>
            </Panel>
          </div>
        </TabsContent>

        {NOT_BUILT_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <div className="rounded-lg border border-dashed bg-card p-8 text-center">
              <p className="font-medium">{tab.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">This section is not built yet.</p>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {editOpen && (
        <ProjectForm
          project={project}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            loadProject();
          }}
        />
      )}
    </div>
  );
}
