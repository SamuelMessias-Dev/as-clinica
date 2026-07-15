import { mockClinics } from "@/lib/mocks/clinic";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Clinic, ClinicSettingsRow, ClinicWorkingHour } from "@/lib/types/database";

export const CLINIC_SETTINGS_ID = "as-estetica";

export type WeekdaySetting = {
  weekday: number;
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  pauseStartsAt: string;
  pauseEndsAt: string;
};

export type ClinicSettingsData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  workingHours: WeekdaySetting[];
};

const defaultClinic = mockClinics[0];

export const defaultWorkingHours: WeekdaySetting[] = [
  { weekday: 0, isOpen: true, opensAt: "08:00", closesAt: "12:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 1, isOpen: false, opensAt: "09:00", closesAt: "18:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 2, isOpen: true, opensAt: "09:00", closesAt: "18:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 3, isOpen: true, opensAt: "09:00", closesAt: "18:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 4, isOpen: true, opensAt: "09:00", closesAt: "18:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 5, isOpen: true, opensAt: "09:00", closesAt: "18:00", pauseStartsAt: "", pauseEndsAt: "" },
  { weekday: 6, isOpen: true, opensAt: "08:00", closesAt: "12:00", pauseStartsAt: "", pauseEndsAt: "" },
];

function normalizeWorkingHours(rows: ClinicWorkingHour[] | null | undefined) {
  return defaultWorkingHours.map((fallback) => {
    const row = rows?.find((item) => item.weekday === fallback.weekday);

    if (!row) return fallback;

    return {
      weekday: row.weekday,
      isOpen: Boolean(row.is_open),
      opensAt: row.opens_at ?? fallback.opensAt,
      closesAt: row.closes_at ?? fallback.closesAt,
      pauseStartsAt: row.pause_starts_at ?? "",
      pauseEndsAt: row.pause_ends_at ?? "",
    };
  });
}

function buildSettings(row?: ClinicSettingsRow | null, hours?: ClinicWorkingHour[] | null): ClinicSettingsData {
  return {
    id: row?.id ?? CLINIC_SETTINGS_ID,
    slug: row?.slug ?? defaultClinic.slug,
    name: row?.name ?? defaultClinic.name,
    description: row?.description ?? defaultClinic.description,
    address: row?.address ?? defaultClinic.address,
    phone: row?.phone ?? defaultClinic.phone,
    email: row?.email ?? "contato@asestetica.com.br",
    website: row?.website ?? "https://www.asestetica.com.br/pg-asclinica",
    workingHours: normalizeWorkingHours(hours),
  };
}

export function clinicSettingsToClinic(settings: ClinicSettingsData): Clinic {
  return {
    id: "clinic_demo_001",
    slug: settings.slug,
    name: settings.name,
    description: settings.description,
    address: settings.address,
    phone: settings.phone,
  };
}

export async function getClinicSettings() {
  if (!hasSupabaseConfig()) {
    return buildSettings();
  }

  try {
    const supabase = await createClient();
    const [settingsResult, hoursResult] = await Promise.all([
      supabase
        .from("clinic_settings")
        .select("*")
        .eq("id", CLINIC_SETTINGS_ID)
        .maybeSingle(),
      supabase
        .from("clinic_working_hours")
        .select("*")
        .eq("clinic_id", CLINIC_SETTINGS_ID)
        .order("weekday", { ascending: true }),
    ]);

    if (settingsResult.error || hoursResult.error) {
      console.error("Supabase clinic settings query failed:", settingsResult.error?.message ?? hoursResult.error?.message);
      return buildSettings();
    }

    return buildSettings(settingsResult.data, hoursResult.data);
  } catch (error) {
    console.error("Clinic settings load failed:", error);
    return buildSettings();
  }
}
