import { CustomersWorkspace } from "@/components/dashboard/customers-workspace";
import { getCustomers } from "@/lib/data/customers";

export default async function Page() {
  const customers = await getCustomers();

  return <CustomersWorkspace customers={customers} />;
}
