import { AgendaWorkspace } from "@/components/dashboard/agenda-workspace";
import { getCustomers } from "@/lib/data/customers";
import { getAgendaWorkspaceData } from "@/lib/data/agenda";
import { getProfessionals } from "@/lib/data/professionals";
import { getProceduresCatalog } from "@/lib/data/procedures";

export default async function Page() {
  const [agendaData, customers, professionalOptions, procedures] = await Promise.all([
    getAgendaWorkspaceData(),
    getCustomers(),
    getProfessionals(),
    getProceduresCatalog("clinic_demo_001"),
  ]);

  return (
    <AgendaWorkspace
      appointments={agendaData.appointments}
      professionals={agendaData.professionals}
      customers={customers}
      professionalOptions={professionalOptions}
      procedures={procedures}
    />
  );
}
