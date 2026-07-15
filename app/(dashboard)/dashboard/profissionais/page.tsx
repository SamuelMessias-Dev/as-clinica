import { ProfessionalsWorkspace } from "@/components/dashboard/professionals-workspace";
import { getProfessionals } from "@/lib/data/professionals";

export default async function Page() {
  const professionals = await getProfessionals();

  return <ProfessionalsWorkspace professionals={professionals} />;
}
