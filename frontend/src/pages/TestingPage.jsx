import { useEffect, useState } from "react";
import { SimpleRecordPage } from "@/components/SimpleRecordPage";
import { deleteTestRecord, listProfessionals, listProjects, listTestRecords, saveTestRecord } from "@/lib/api";
import { TEST_RESULTS } from "@/lib/constants";
import { nameWithId } from "@/lib/projectHelpers";

export default function TestingPage() {
  const [projects, setProjects] = useState([]);
  const [professionals, setProfessionals] = useState([]);

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
    { name: "test_type", label: "Test type", required: true, showInTable: true, placeholder: "e.g. Insulation resistance" },
    { name: "test_date", label: "Test date", type: "date", required: true, showInTable: true },
    {
      name: "tested_by", label: "Tested by", type: "select",
      options: professionals.map((p) => ({ value: p._id, label: nameWithId(p) })),
      display: (record) => nameWithId(record.tested_by),
    },
    { name: "result", label: "Result", type: "select", options: TEST_RESULTS, required: true, showInTable: true, defaultValue: "Pending" },
    { name: "certificate_number", label: "Certificate number", showInTable: true },
    { name: "certificate_date", label: "Certificate date", type: "date" },
    { name: "measurements", label: "Test results / measured values", type: "textarea" },
    { name: "remarks", label: "Remarks", type: "textarea" },
  ];

  return (
    <SimpleRecordPage
      title="Testing and Certification"
      singular="Test record"
      fields={fields}
      loadRecords={listTestRecords}
      saveRecord={saveTestRecord}
      deleteRecord={deleteTestRecord}
      recordName={(record) => record.test_type}
    />
  );
}