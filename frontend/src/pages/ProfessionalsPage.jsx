import { useOutletContext } from "react-router-dom";
import { SimpleRecordPage } from "@/components/SimpleRecordPage";
import { deleteProfessional, listProfessionals, saveProfessional } from "@/lib/api";
import { PROFESSIONAL_FIELDS } from "@/lib/constants";

export default function ProfessionalsPage() {
  const { profile } = useOutletContext(); 
  return (
    <SimpleRecordPage
      title="Professionals"
      singular="Professional"
      fields={PROFESSIONAL_FIELDS}
      loadRecords={listProfessionals}
      saveRecord={saveProfessional}
      deleteRecord={deleteProfessional}
      canDelete={profile?.role === "admin"}
    />
  );
}