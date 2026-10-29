import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, Pencil, Plus } from "lucide-react";
import { PageHeader, EmptyState } from "./PageHeader";
import { ConfirmDelete } from "./ConfirmDelete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const selectClass = "flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm";

// Checks a chosen file: it must be a PDF and not too big. Returns an error message, or "" if it is fine.
export function pdfProblem(file, maxSizeMB = 10) {
  if (!file.name.toLowerCase().endsWith(".pdf")) return "Only PDF files are allowed.";
  if (file.size === 0) return "The file is empty.";
  if (file.size > maxSizeMB * 1024 * 1024) return `The file is too large (maximum ${maxSizeMB} MB).`;
  return "";
}

// Checks required fields and email / phone / ID / file formats on the form.
export function validateFields(fields, values) {
  const errors = {};
  for (const field of fields) {
    if (field.tableOnly) continue; // not a form box
    if (field.type === "file") {
      const file = values[field.name];
      const problem = file ? pdfProblem(file, field.maxSizeMB) : field.required ? `${field.label} is required.` : "";
      if (problem) errors[field.name] = problem;
      continue;
    }
    const value = (values[field.name] ?? "").trim();
    if (field.required && !value) {
      errors[field.name] = `${field.label} is required.`;
    } else if (value && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.name] = "Enter a valid email.";
    } else if (value && field.type === "tel" && !/^[0-9+\s()-]{7,20}$/.test(value)) {
      errors[field.name] = "Enter a valid phone number.";
    } else if (value && field.pattern && !field.pattern.test(value)) {
      errors[field.name] = field.patternMessage;
    }
  }
  return errors;
}

//text shown for field of one record table, search,details window
function cellText(record, field) {
  if (field.display) return field.display(record);
  const value = record[field.name];
  if (value === null || value === undefined) return "";
  if (field.type === "date") return String(value).slice(0, 10);
  return String(value);
}


function startValue(record, field) {
  const value = record ? record[field.name] : field.defaultValue;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return value._id ?? "";
  if (field.type === "date") return String(value).slice(0, 10);
  return value;
}


export function SimpleRecordPage({
  title, singular, fields, loadRecords, saveRecord, deleteRecord,
    canDelete = true, recordName = (record) => record.name, rowActions, renderDetails,
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);

  async function loadAll() {
    try {
      setRecords(await loadRecords());
      setLoadError("");
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openForm(record) {
    setEditingId(record ? record._id : null);
    const startValues = {};
    for (const field of fields) {
      if (!field.tableOnly && !(field.addOnly && record)) startValues[field.name] = startValue(record, field);
    }
    setValues(startValues);
    setErrors({});
    setFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problems = validateFields(fields, values);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    try {
      await saveRecord(values, editingId);
      toast.success(`${singular} ${editingId ? "updated" : "added"}`);
      setFormOpen(false);
      loadAll();
    } catch (error) {
      if (error.fieldErrors) setErrors(error.fieldErrors);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteRecord(id);
      toast.success(`${singular} deleted`);
      loadAll();
    } catch (error) {
      toast.error(error.message);
    }
  }

  // Search looks at every field of record.
  const text = search.toLowerCase();
  const visibleRecords = records.filter((record) =>
    fields.some((field) => cellText(record, field).toLowerCase().includes(text)),
  );
  const tableFields = fields.filter((field) => field.showInTable);
  const formFields = fields.filter((field) => !field.tableOnly && !(field.addOnly && editingId));
  function renderInput(field) {
    const value = values[field.name] ?? "";
    const onChange = (e) => setValues({ ...values, [field.name]: e.target.value });
        if (field.type === "file") {
      return (
        <input
          id={field.name}
          type="file"
          accept={field.accept}
          className="block w-full text-sm"
          onChange={(e) => setValues({ ...values, [field.name]: e.target.files[0] ?? null })}
        />
      );
    }
    if (field.type === "select") {
      return (
        <select id={field.name} className={selectClass} value={value} onChange={onChange}>
          <option value="">— Choose —</option>
          {field.options.map((option) => {
            const optionValue = typeof option === "string" ? option : option.value;
            const optionLabel = typeof option === "string" ? option : option.label;
            return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
          })}
        </select>
      );
    }
    return <Input id={field.name} type={field.type ?? "text"} placeholder={field.placeholder} value={value} onChange={onChange} />;
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${records.length} records`}
        actions={<Button onClick={() => openForm(null)}><Plus className="mr-1 h-4 w-4" />Add {singular.toLowerCase()}</Button>}
      />
      <Input className="mb-4 w-72" placeholder="Search by ID or any detail…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : loadError ? (
        <p className="text-sm text-destructive">Could not load: {loadError}</p>
      ) : visibleRecords.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} found`} text={`Add your first ${singular.toLowerCase()}.`} />
      ) : (
        <div className="shadow-card overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {tableFields.map((field) => <TableHead key={field.name}>{field.label}</TableHead>)}
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRecords.map((record) => (
                <TableRow key={record._id}>
                  {tableFields.map((field) => <TableCell key={field.name}>{cellText(record, field) || "—"}</TableCell>)}
                  <TableCell className="flex">
                    <Button variant="ghost" size="icon" onClick={() => setViewing(record)} aria-label="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {rowActions && rowActions(record)}
                    <Button variant="ghost" size="icon" onClick={() => openForm(record)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {canDelete && <ConfirmDelete itemName={recordName(record)} onConfirm={() => handleDelete(record._id)} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing ? recordName(viewing) : ""}</DialogTitle>
          </DialogHeader>
                    {viewing && (
            <>
              <dl className="grid gap-4 sm:grid-cols-2">
                {fields.filter((field) => field.type !== "file").map((field) => (
                  <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <dt className="text-xs text-muted-foreground">{field.label}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm">{cellText(viewing, field) || "Not recorded"}</dd>
                  </div>
                ))}
              </dl>
              {renderDetails && renderDetails(viewing)}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
            {formFields.map((field) => (
              <div key={field.name} className={field.type === "textarea" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
                <Label htmlFor={field.name}>{field.label}{field.required && " *"}</Label>
                {renderInput(field)}
                {errors[field.name] && <p className="text-xs text-destructive">{errors[field.name]}</p>}
              </div>
            ))}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}