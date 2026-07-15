import { SettingsWorkspace } from "@/components/dashboard/settings-workspace";
import { mockClinics } from "@/lib/mocks/clinic";

export default function Page() {
  return <SettingsWorkspace clinic={mockClinics[0]} />;
}
