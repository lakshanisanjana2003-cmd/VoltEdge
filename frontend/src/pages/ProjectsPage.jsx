import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { deleteProject, listProjects } from "@/lib/api";
import { BUILDING_TYPES, PROJECT_STATUSES } from "@/lib/constants";
import { nextProjectCode, onlyDate } from "@/lib/projectHelpers";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { ProjectForm } from "@/components/ProjectForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAGE_SIZE = 10;
const selectClass = "h-9 rounded-md border border-input bg-card px-3 text-sm";

export default function ProjectsPage() {
  // The top bar search puts the text in the address: /projects?q=hospital
  const [searchParams] = useSearchParams();
  const searchFromAddress = searchParams.get("q") ?? "";

  const [projects, setProjects] = useState([]);
  const [allCodes, setAllCodes] = useState([]); // every project code, to suggest the next one
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchFromAddress);
  const [status, setStatus] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [startFrom, setStartFrom] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // When the top bar search changes the address, update the search box too.
  useEffect(() => {
    setSearch(searchFromAddress);
    setPage(1);
  }, [searchFromAddress]);

  // Ask the API for the projects whenever a search, filter or sort changes.
  // The API searches MongoDB. "ignore" stops an older answer from replacing a newer one.
  const filters = { q: search.trim(), status, building_type: buildingType, start_from: startFrom, sort: sortBy };
  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    let ignore = false;
    listProjects(filters)
      .then((result) => {
        if (ignore) return;
        setProjects(result);
        setError("");
      })
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [filtersKey]);

  async function loadAllCodes() {
    try {
      const all = await listProjects();
      setAllCodes(all.map((project) => project.project_code));
    } catch {
      setAllCodes([]);
    }
  }
  useEffect(() => {
    loadAllCodes();
  }, []);

  // Reload the table after adding, editing or deleting.
  async function refresh() {
    setProjects(await listProjects(filters));
    loadAllCodes();
  }

  async function handleDelete(id) {
    try {
      await deleteProject(id);
      toast.success("Project deleted");
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function openForm(project) {
    setEditingProject(project);
    setFormOpen(true);
  }

  // Change one filter and go back to page 1.
  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const visibleProjects = projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} ${projects.length === 1 ? "project" : "projects"}`}
        actions={
          <>
            <select className={selectClass + " whitespace-nowrap"} value={sortBy} onChange={(e) => changeFilter(setSortBy, e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="deadline">Deadline (soonest)</option>
            </select>
            <label className="flex items-center gap-1 text-sm text-muted-foreground">
              Started after
              <Input type="date" className="w-40" value={startFrom} onChange={(e) => changeFilter(setStartFrom, e.target.value)} />
            </label>
            <Button disabled={loading || Boolean(error)} onClick={() => openForm(null)}>
              <Plus className="mr-1 h-4 w-4" />Add project
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="w-56" placeholder="Search ID or name" value={search} onChange={(e) => changeFilter(setSearch, e.target.value)} />
        <select className={selectClass} value={status} onChange={(e) => changeFilter(setStatus, e.target.value)}>
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={selectClass} value={buildingType} onChange={(e) => changeFilter(setBuildingType, e.target.value)}>
          <option value="">All building types</option>
          {BUILDING_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      ) : error ? (
        <p className="text-sm text-destructive">Could not load projects: {error}</p>
      ) : projects.length === 0 ? (
        <EmptyState title="No projects found" text="Try a different search or add a new project." />
      ) : (
        <div className="shadow-card overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead className="hidden lg:table-cell">Building</TableHead>
                <TableHead className="hidden md:table-cell">Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleProjects.map((project) => (
                <TableRow key={project._id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">{project.project_code}</TableCell>
                  <TableCell>
                    <Link to={`/projects/${project._id}`} className="font-medium hover:underline">{project.name}</Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{project.client?.name ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{project.building_type}</TableCell>
                  <TableCell className="hidden whitespace-nowrap font-mono text-xs md:table-cell">
                    {onlyDate(project.expected_completion_date) || "—"}
                  </TableCell>
                  <TableCell><StatusBadge value={project.status} /></TableCell>
                  <TableCell className="flex">
                    <Button variant="ghost" size="icon" onClick={() => openForm(project)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDelete itemName={project.name} onConfirm={() => handleDelete(project._id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {page} of {pageCount}</span>
          <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {formOpen && (
        <ProjectForm
          project={editingProject}
          suggestedCode={nextProjectCode(allCodes)}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
