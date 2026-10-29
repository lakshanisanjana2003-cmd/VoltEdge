import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, History } from "lucide-react";
import { pdfProblem, SimpleRecordPage } from "@/components/SimpleRecordPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteDrawing, downloadRevisionFile, listDrawings, listProjects, saveDrawing, uploadRevision } from "@/lib/api";
import { DOCUMENT_TYPES, DRAWING_STATUSES } from "@/lib/constants";
import { onlyDate } from "@/lib/projectHelpers";

// The list of revisions of one drawing: file name, size, upload date and a Download button.
function RevisionList({ drawing }) {
  async function handleDownload(revision) {
    try {
      await downloadRevisionFile(drawing._id, revision);
    } catch (error) {
      toast.error(error.message);
    }
  }

  if (drawing.revisions.length === 0) {
    return <p className="text-sm text-muted-foreground">No PDF has been uploaded yet.</p>;
  }

  const revisions = [...drawing.revisions].reverse(); // newest first
  return (
    <ul className="divide-y rounded-md border">
      {revisions.map((revision) => (
        <li key={revision._id} className="flex items-center justify-between gap-3 p-3 text-sm">
          <div>
            <p className="font-medium">
              Revision {revision.revision}{" "}
              <span className="font-mono text-xs text-muted-foreground">{onlyDate(revision.revision_date)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {revision.original_name} ({Math.max(1, Math.round(revision.size / 1024))} KB, uploaded{" "}
              {onlyDate(revision.uploaded_at ?? revision.revision_date)})
              {revision.description ? ` — ${revision.description}` : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleDownload(revision)}>
            <Download className="mr-1 h-4 w-4" />Download
          </Button>
        </li>
      ))}
    </ul>
  );
}

// The window that lists the revisions of one drawing and uploads a new one.
function RevisionsDialog({ drawing, onClose, onChanged }) {
  const today = new Date().toISOString().slice(0, 10);
  const [values, setValues] = useState({ revision: "", revision_date: today, description: "" });
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0); // changing the key empties the file box
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function handleUpload(event) {
    event.preventDefault();
    const problems = {};
    if (!values.revision.trim()) problems.revision = "Revision is required (for example A or 01).";
    if (!values.revision_date) problems.revision_date = "Enter the revision date.";
    if (!file) problems.file = "Choose a PDF file.";
    else if (pdfProblem(file)) problems.file = pdfProblem(file);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    // A file must be sent as a form (FormData), not as JSON.
    const formData = new FormData();
    formData.append("revision", values.revision);
    formData.append("revision_date", values.revision_date);
    formData.append("description", values.description);
    formData.append("file", file);

    setSaving(true);
    try {
      await uploadRevision(drawing._id, formData);
      toast.success("Revision uploaded");
      setValues({ revision: "", revision_date: today, description: "" });
      setFile(null);
      setFileInputKey(fileInputKey + 1);
      onChanged();
    } catch (error) {
      if (error.fieldErrors) setErrors(error.fieldErrors);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{drawing.drawing_number} – {drawing.title}</DialogTitle>
        </DialogHeader>

        <h3 className="text-sm font-semibold">Revisions</h3>
        <RevisionList drawing={drawing} />

        <form onSubmit={handleUpload} className="grid gap-3 sm:grid-cols-2" noValidate>
          <h3 className="text-sm font-semibold sm:col-span-2">Upload a new revision</h3>
          <div className="space-y-1.5">
            <Label htmlFor="revision">Revision *</Label>
            <Input id="revision" placeholder="e.g. A or 01" value={values.revision}
              onChange={(e) => setValues({ ...values, revision: e.target.value })} />
            {errors.revision && <p className="text-xs text-destructive">{errors.revision}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="revision_date">Revision date *</Label>
            <Input id="revision_date" type="date" value={values.revision_date}
              onChange={(e) => setValues({ ...values, revision_date: e.target.value })} />
            {errors.revision_date && <p className="text-xs text-destructive">{errors.revision_date}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">What changed</Label>
            <Input id="description" value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="file">Upload Drawing (PDF) * (up to 10 MB)</Label>
            <input id="file" key={fileInputKey} type="file" accept="application/pdf,.pdf" className="block w-full text-sm"
              onChange={(e) => setFile(e.target.files[0] ?? null)} />
            {errors.file && <p className="text-xs text-destructive">{errors.file}</p>}
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? "Uploading…" : "Upload revision"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DrawingsPage() {
  const [projects, setProjects] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [revisionsForId, setRevisionsForId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // changing it reloads the table

  useEffect(() => {
    listProjects().then(setProjects).catch(() => {});
  }, []);

  // Loads the drawings for the table and keeps a copy for the revisions window.
  async function loadDrawings() {
    const list = await listDrawings();
    setDrawings(list);
    return list;
  }

  const openDrawing = drawings.find((drawing) => drawing._id === revisionsForId);

  const fields = [
    {
      name: "drawing_number", label: "Drawing / document number", required: true, showInTable: true, placeholder: "e.g. EL-101",
      pattern: /^[A-Za-z0-9][A-Za-z0-9./-]{2,29}$/, patternMessage: "Use 3–30 letters, numbers, dots, slashes or dashes.",
    },
    { name: "title", label: "Title", required: true, showInTable: true },
    {
      name: "project", label: "Project", type: "select", required: true, showInTable: true,
      options: projects.map((p) => ({ value: p._id, label: `${p.project_code} – ${p.name}` })),
      display: (record) => (record.project ? `${record.project.project_code} – ${record.project.name}` : ""),
    },
    { name: "document_type", label: "Type", type: "select", options: DOCUMENT_TYPES, required: true, showInTable: true, defaultValue: "Drawing" },
    { name: "status", label: "Status", type: "select", options: DRAWING_STATUSES, required: true, showInTable: true, defaultValue: "Draft" },
    // The PDF box only appears when adding a drawing. More revisions are added with the history icon.
    { name: "file", label: "Upload Drawing (PDF)", type: "file", addOnly: true, accept: "application/pdf,.pdf", maxSizeMB: 10 },
    {
      name: "revisions", label: "Latest revision", tableOnly: true, showInTable: true,
      display: (record) => (record.revisions.length > 0 ? record.revisions[record.revisions.length - 1].revision : "None"),
    },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  return (
    <>
      <SimpleRecordPage
        key={refreshKey}
        title="Drawings and Documents"
        singular="Drawing"
        fields={fields}
        loadRecords={loadDrawings}
        saveRecord={saveDrawing}
        deleteRecord={deleteDrawing}
        recordName={(record) => record.drawing_number}
        renderDetails={(record) => (
          <div className="mt-2">
            <h3 className="mb-2 text-sm font-semibold">Revisions and PDF files</h3>
            <RevisionList drawing={record} />
          </div>
        )}
        rowActions={(record) => (
          <Button variant="ghost" size="icon" aria-label="Revisions and files" onClick={() => setRevisionsForId(record._id)}>
            <History className="h-4 w-4" />
          </Button>
        )}
      />
      {openDrawing && (
        <RevisionsDialog
          drawing={openDrawing}
          onClose={() => setRevisionsForId(null)}
          onChanged={() => setRefreshKey(refreshKey + 1)}
        />
      )}
    </>
  );
}