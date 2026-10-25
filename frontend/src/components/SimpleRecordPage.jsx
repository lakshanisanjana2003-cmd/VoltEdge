import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { PageHeader, EmptyState } from "./PageHeader";
import { ConfirmDelete } from "./ConfirmDelete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const selectClass = "flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm";

// Checks required fields and email / phone formats on the form.
function validateFields(fields, values) {
  const errors = {};
  for (const field of fields) {
    const value = (values[field.name] ?? "").trim();
    if (field.required && !value) {
      errors[field.name] = `${field.label} is required.`;
    } else if (value && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.name] = "Enter a valid email.";
    } else if (value && field.type === "tel" && !/^[0-9+\s()-]{7,20}$/.test(value)) {
      errors[field.name] = "Enter a valid phone number.";
    }
  }
  return errors;
}

// One page with a search box, a table and an add / edit form.
// Clients and Professionals both use it. "fields" describes the columns and form inputs.
export function SimpleRecordPage({ title, singular, fields, loadRecords, saveRecord, deleteRecord }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
    for (const field of fields) startValues[field.name] = record?.[field.name] ?? "";
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

  // Search looks at every field of the record.
  const text = search.toLowerCase();
  const visibleRecords = records.filter((record) =>
    fields.some((field) => String(record[field.name] ?? "").toLowerCase().includes(text)),
  );
  const tableFields = fields.filter((field) => field.showInTable);

  function renderInput(field) {
    const value = values[field.name] ?? "";
    const onChange = (e) => setValues({ ...values, [field.name]: e.target.value });
    if (field.type === "textarea") return <Textarea id={field.name} value={value} onChange={onChange} />;
    if (field.type === "select") {
      return (
        <select id={field.name} className={selectClass} value={value} onChange={onChange}>
          <option value="">— Choose —</option>
          {field.options.map((option) => <option key={option}>{option}</option>)}
        </select>
      );
    }
    return <Input id={field.name} type={field.type ?? "text"} value={value} onChange={onChange} />;
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${records.length} records`}
        actions={<Button onClick={() => openForm(null)}><Plus className="mr-1 h-4 w-4" />Add {singular.toLowerCase()}</Button>}
      />
      <Input className="mb-4 w-64" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />

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
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRecords.map((record) => (
                <TableRow key={record._id}>
                  {tableFields.map((field) => <TableCell key={field.name}>{record[field.name] ?? "—"}</TableCell>)}
                  <TableCell className="flex">
                    <Button variant="ghost" size="icon" onClick={() => openForm(record)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDelete itemName={record.name} onConfirm={() => handleDelete(record._id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
            {fields.map((field) => (
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
