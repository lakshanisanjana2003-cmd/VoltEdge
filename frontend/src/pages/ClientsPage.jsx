import { SimpleRecordPage } from "@/components/SimpleRecordPage";
import { deleteClient, listClients, saveClient } from "@/lib/api";

// Columns and form inputs for the Clients page.
const CLIENT_FIELDS = [
  { name: "name", label: "Client name", required: true, showInTable: true },
  { name: "company", label: "Company", showInTable: true },
  { name: "contact_person", label: "Contact person", showInTable: true },
  { name: "phone", label: "Phone", type: "tel", showInTable: true },
  { name: "email", label: "Email", type: "email", showInTable: true },
  { name: "address", label: "Address", type: "textarea" },
  { name: "notes", label: "Notes", type: "textarea" },
];

export default function ClientsPage() {
  return (
    <SimpleRecordPage
      title="Clients"
      singular="Client"
      fields={CLIENT_FIELDS}
      loadRecords={listClients}
      saveRecord={saveClient}
      deleteRecord={deleteClient}
    />
  );
}
