import { getMockClinicBySlug } from "@/lib/mocks/clinic";
export { getServicesByClinicId } from "@/lib/data/procedures";

export async function getClinicBySlug(slug: string) {
  return getMockClinicBySlug(slug);
}
