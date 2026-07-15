import { SettingsWorkspace } from "@/components/dashboard/settings-workspace";
import { getClinicSettings } from "@/lib/data/clinic-settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const settings = await getClinicSettings();

  return <SettingsWorkspace initialSettings={settings} />;
}
