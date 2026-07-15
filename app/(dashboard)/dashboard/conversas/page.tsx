import { ConversationsWorkspace } from "@/components/dashboard/conversations-workspace";
import { getCustomers } from "@/lib/data/customers";
import { getProfessionals } from "@/lib/data/professionals";
import { getProceduresCatalog } from "@/lib/data/procedures";

export default async function Page() {
  const [customers, professionalOptions, procedures] = await Promise.all([
    getCustomers(),
    getProfessionals(),
    getProceduresCatalog("clinic_demo_001"),
  ]);

  return <ConversationsWorkspace customers={customers} professionalOptions={professionalOptions} procedures={procedures} />;
}
