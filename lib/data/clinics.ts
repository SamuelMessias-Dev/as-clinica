import { getMockClinicBySlug } from "@/lib/mocks/clinic";
import { clinicSettingsToClinic, getClinicSettings } from "@/lib/data/clinic-settings";
export { getServicesByClinicId } from "@/lib/data/procedures";

export async function getClinicBySlug(slug: string) {
  const settings = await getClinicSettings();

  if (settings.slug === slug || slug === "clinica-bela") {
    return clinicSettingsToClinic(settings);
  }

  return getMockClinicBySlug(slug);
}
