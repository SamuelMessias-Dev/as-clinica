import { AgendaWorkspace } from "@/components/dashboard/agenda-workspace";
import { getCustomers } from "@/lib/data/customers";
import { getAgendaWorkspaceData } from "@/lib/data/agenda";
import { getClinicSettings } from "@/lib/data/clinic-settings";
import { getProfessionals } from "@/lib/data/professionals";
import { getProceduresCatalog } from "@/lib/data/procedures";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [agendaData, customers, professionalOptions, procedures, clinicSettings] = await Promise.all([
    getAgendaWorkspaceData(),
    getCustomers(),
    getProfessionals(),
    getProceduresCatalog("clinic_demo_001"),
    getClinicSettings(),
  ]);

  return (
    <AgendaWorkspace
      appointments={agendaData.appointments}
      professionals={agendaData.professionals}
      customers={customers}
      professionalOptions={professionalOptions}
      procedures={procedures}
      workingHours={clinicSettings.workingHours}
    />
  );
}
