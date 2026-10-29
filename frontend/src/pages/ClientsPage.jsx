import { SimpleRecordPage } from "@/components/SimpleRecordPage";
import { deleteClient, listClients, saveClient } from "@/lib/api";
import { useOutletContext } from "react-router-dom";

// Columns ,form inputs for Clients page.
const CLIENT_FIELDS = [
    {
    name: "client_id", label: "Client ID", required: true, showInTable: true, placeholder: "e.g. CL-001",
    pattern: /^[A-Za-z0-9-]{3,20}$/, patternMessage: "Use 3–20 letters, numbers or dashes, for example CL-001.",
  },
  { name: "name", label: "Client name", required: true, showInTable: true },
  { name: "company", label: "Company", showInTable: true },
  { name: "contact_person", label: "Contact person", showInTable: true },
  { name: "phone", label: "Phone", type: "tel", showInTable: true },
  { name: "email", label: "Email", type: "email", showInTable: true },
  { name: "address", label: "Address", type: "textarea" },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function ClientsPage() {
  const { profile } = useOutletContext(); 
  return (
    <SimpleRecordPage
      title="Clients"
      singular="Client"
      fields={CLIENT_FIELDS}
      loadRecords={listClients}
      saveRecord={saveClient}
      deleteRecord={deleteClient}
      canDelete={profile?.role === "admin"}
    />
  );
}
