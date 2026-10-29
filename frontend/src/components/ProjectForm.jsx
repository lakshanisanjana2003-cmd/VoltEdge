import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listClients, listProfessionals, saveProject } from "@/lib/api";
import { BUILDING_TYPES, PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/lib/constants";
import { nameWithId, onlyDate, validateProject } from "@/lib/projectHelpers";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

// Turns saved project into text values used by form inputs.
function projectToForm(project, suggestedCode) {
  return {
    project_code: project?.project_code ?? suggestedCode ?? "",
    name: project?.name ?? "",
    client: project?.client?._id ?? "",
    building_type: project?.building_type ?? "",
    location: project?.location ?? "",
    description: project?.description ?? "",
    project_stage: project?.project_stage ?? "",
    consulting_organization: project?.consulting_organization ?? "",
    project_duration: project?.project_duration ?? "",
    activity_history: project?.activity_history ?? "",
    start_date: onlyDate(project?.start_date),
    expected_completion_date: onlyDate(project?.expected_completion_date),
    actual_completion_date: onlyDate(project?.actual_completion_date),
    status: project?.status ?? "Planned",
    priority: project?.priority ?? "Not recorded",
    design_engineer: project?.design_engineer?._id ?? "",
    draughtsman: project?.draughtsman?._id ?? "",
    main_contractor: project?.main_contractor ?? "",
    notes: project?.notes ?? "",
  };
}

// Add / edit project form "project" is empty adding a project.
export function ProjectForm({ project, suggestedCode, onClose, onSaved }) {
  const [values, setValues] = useState(projectToForm(project, suggestedCode));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [professionals, setProfessionals] = useState([]);

  // Fill client ,professional drop-downs from database.
  useEffect(() => {
    listClients().then(setClients).catch(() => {});
    listProfessionals().then(setProfessionals).catch(() => {});
  }, []);

  function changeValue(name, value) {
    setValues({ ...values, [name]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problems = validateProject(values);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return; // do not call server

    setSaving(true);
    try {
      await saveProject(values, project?._id);
      toast.success(project ? "Project updated" : "Project created");
      onSaved();
    } catch (error) {
      // The server checks everything again. Show its messages next to fields.
      if (error.fieldErrors) setErrors(error.fieldErrors);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  // label + input + error message.
  function field(name, label, input) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={name}>{label}</Label>
        {input}
        {errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}
      </div>
    );
  }
  function textInput(name, type = "text") {
    return <Input id={name} type={type} value={values[name]} onChange={(e) => changeValue(name, e.target.value)} />;
  }
  function select(name, options, emptyLabel) {
    return (
      <select id={name} className={selectClass} value={values[name]} onChange={(e) => changeValue(name, e.target.value)}>
        {emptyLabel && <option value="">{emptyLabel}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }
  function textArea(name) {
    return <Textarea id={name} value={values[name]} onChange={(e) => changeValue(name, e.target.value)} />;
  }

  const plainOptions = (list) => list.map((item) => ({ value: item, label: item }));
  const personOptions = (list) => list.map((item) => ({ value: item._id, label: nameWithId(item) }));
  const engineers = professionals.filter((p) => p.role === "Electrical Design Engineer" || p.role === "Electrical Engineer");
  const draughtsmen = professionals.filter((p) => p.role === "Draughtsman");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "Add project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
          {field("project_code", "Project ID *", textInput("project_code"))}
          {field("name", "Project name *", textInput("name"))}
          {field("client", "Client", select("client", personOptions(clients), "— None —"))}
          {field("building_type", "Building type *", select("building_type", plainOptions(BUILDING_TYPES), "— Choose —"))}
          {field("location", "Location", textInput("location"))}
          {field("main_contractor", "Main contractor", textInput("main_contractor"))}
          {field("project_stage", "Project stage", textInput("project_stage"))}
          {field("consulting_organization", "Consulting organisation", textInput("consulting_organization"))}
          <div className="sm:col-span-2">{field("project_duration", "Project duration", textInput("project_duration"))}</div>
          {field("start_date", "Start date", textInput("start_date", "date"))}
          {field("expected_completion_date", "Expected completion", textInput("expected_completion_date", "date"))}
          {field("actual_completion_date", "Actual completion", textInput("actual_completion_date", "date"))}
          {field("status", "Status", select("status", plainOptions(PROJECT_STATUSES)))}
          {field("priority", "Priority", select("priority", plainOptions(PROJECT_PRIORITIES)))}
          {field("design_engineer", "Design engineer", select("design_engineer", personOptions(engineers), "— None —"))}
          {field("draughtsman", "Draughtsman", select("draughtsman", personOptions(draughtsmen), "— None —"))}
          <div className="sm:col-span-2">{field("description", "Description and scope", textArea("description"))}</div>
          <div className="sm:col-span-2">{field("activity_history", "Completed activity history", textArea("activity_history"))}</div>
          <div className="sm:col-span-2">{field("notes", "Notes", textArea("notes"))}</div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save project"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
