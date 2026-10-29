import { useEffect, useState } from "react";
import { SimpleRecordPage } from "@/components/SimpleRecordPage";
import { deleteSiteVisit, listProfessionals, listProjects, listSiteVisits, saveSiteVisit } from "@/lib/api";
import { VISIT_STATUSES } from "@/lib/constants";
import { nameWithId } from "@/lib/projectHelpers";

export default function SiteVisitsPage() {
  const [projects, setProjects] = useState([]);
  const [professionals, setProfessionals] = useState([]);

  // Project and Visited by dropdowns come from database.
  useEffect(() => {
    listProjects().then(setProjects).catch(() => {});
    listProfessionals().then(setProfessionals).catch(() => {});
  }, []);

  const fields = [
    {
      name: "project", label: "Project", type: "select", required: true, showInTable: true,
      options: projects.map((p) => ({ value: p._id, label: `${p.project_code} – ${p.name}` })),
      display: (record) => (record.project ? `${record.project.project_code} – ${record.project.name}` : ""),
    },
    { name: "visit_date", label: "Visit date", type: "date", required: true, showInTable: true },
    {
      name: "visited_by", label: "Visited by", type: "select", showInTable: true,
      options: professionals.map((p) => ({ value: p._id, label: nameWithId(p) })),
      display: (record) => nameWithId(record.visited_by),
    },
    { name: "status", label: "Status", type: "select", options: VISIT_STATUSES, required: true, showInTable: true, defaultValue: "Scheduled" },
    { name: "purpose", label: "Purpose of visit" },
    { name: "inspection_notes", label: "Inspection notes", type: "textarea" },
    { name: "follow_up_actions", label: "Follow-up actions", type: "textarea" },
  ];

  return (
    <SimpleRecordPage
      title="Site Visits"
      singular="Site visit"
      fields={fields}
      loadRecords={listSiteVisits}
      saveRecord={saveSiteVisit}
      deleteRecord={deleteSiteVisit}
      recordName={(record) => `the visit on ${String(record.visit_date).slice(0, 10)}`}
    />
  );
}