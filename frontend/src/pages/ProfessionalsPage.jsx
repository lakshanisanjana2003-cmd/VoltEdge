import { SimpleRecordPage } from "@/components/SimpleRecordPage";
import { deleteProfessional, listProfessionals, saveProfessional } from "@/lib/api";
import { PROFESSIONAL_ROLES } from "@/lib/constants";

// Columns and form inputs for the Professionals page.
const PROFESSIONAL_FIELDS = [
  { name: "name", label: "Name", required: true, showInTable: true },
  { name: "role", label: "Professional role", type: "select", options: PROFESSIONAL_ROLES, required: true, showInTable: true },
  { name: "organization", label: "Organization", showInTable: true },
  { name: "phone", label: "Phone", type: "tel", showInTable: true },
  { name: "email", label: "Email", type: "email", showInTable: true },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function ProfessionalsPage() {
  return (
    <SimpleRecordPage
      title="Professionals"
      singular="Professional"
      fields={PROFESSIONAL_FIELDS}
      loadRecords={listProfessionals}
      saveRecord={saveProfessional}
      deleteRecord={deleteProfessional}
    />
  );
}
