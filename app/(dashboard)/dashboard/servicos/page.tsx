import { ServicesCatalog } from "@/components/dashboard/services-catalog";
import { getProceduresCatalog } from "@/lib/data/procedures";

export default async function Page() {
  const procedures = await getProceduresCatalog("clinic_demo_001");

  return <ServicesCatalog procedures={procedures} />;
}
