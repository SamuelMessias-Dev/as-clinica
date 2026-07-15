"use server";

import { revalidatePath } from "next/cache";
import { CLINIC_SETTINGS_ID, type ClinicSettingsData } from "@/lib/data/clinic-settings";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ClinicSettingsRow, ClinicWorkingHour } from "@/lib/types/database";

export type SaveClinicSettingsResult = {
  success: boolean;
  error?: string;
  data?: ClinicSettingsData;
};

function cleanText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function cleanTime(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

export async function saveClinicSettings(settings: ClinicSettingsData): Promise<SaveClinicSettingsResult> {
  if (!hasSupabaseConfig()) {
    return { success: false, error: "Supabase não configurado. Não foi possível salvar no banco." };
  }

  if (!settings.name.trim()) {
    return { success: false, error: "Informe o nome da clínica." };
  }

  try {
    const supabase = await createClient();

    const settingsPayload = {
      id: CLINIC_SETTINGS_ID,
      slug: settings.slug || "clinica-bela",
      name: settings.name.trim(),
      description: cleanText(settings.description),
      address: cleanText(settings.address),
      phone: cleanText(settings.phone),
      email: cleanText(settings.email),
      website: cleanText(settings.website),
      updated_at: new Date().toISOString(),
    };

    const { data: savedSettings, error: settingsError } = await supabase
      .from("clinic_settings")
      .upsert(settingsPayload as never)
      .select()
      .single();

    if (settingsError) {
      return { success: false, error: settingsError.message };
    }

    const clinicSettings = savedSettings as ClinicSettingsRow | null;

    const rows = settings.workingHours.map((day) => ({
      clinic_id: CLINIC_SETTINGS_ID,
      weekday: day.weekday,
      is_open: day.isOpen,
      opens_at: cleanTime(day.opensAt),
      closes_at: cleanTime(day.closesAt),
      pause_starts_at: cleanTime(day.pauseStartsAt),
      pause_ends_at: cleanTime(day.pauseEndsAt),
      updated_at: new Date().toISOString(),
    }));

    const { data: savedHours, error: hoursError } = await supabase
      .from("clinic_working_hours")
      .upsert(rows as never[], { onConflict: "clinic_id,weekday" })
      .select()
      .order("weekday", { ascending: true });

    if (hoursError) {
      return { success: false, error: hoursError.message };
    }

    if (!clinicSettings) {
      return { success: false, error: "Não foi possível recuperar as configurações salvas." };
    }

    const clinicHours = (savedHours ?? []) as ClinicWorkingHour[];

    revalidatePath("/dashboard/configuracoes");
    revalidatePath("/pg-asclinica");
    revalidatePath("/clinica/[slug]", "page");

    return {
      success: true,
      data: {
        id: clinicSettings.id,
        slug: clinicSettings.slug,
        name: clinicSettings.name,
        description: clinicSettings.description ?? "",
        address: clinicSettings.address ?? "",
        phone: clinicSettings.phone ?? "",
        email: clinicSettings.email ?? "",
        website: clinicSettings.website ?? "",
        workingHours: clinicHours.map((day) => ({
          weekday: day.weekday,
          isOpen: day.is_open,
          opensAt: day.opens_at ?? "",
          closesAt: day.closes_at ?? "",
          pauseStartsAt: day.pause_starts_at ?? "",
          pauseEndsAt: day.pause_ends_at ?? "",
        })),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao salvar configurações.";
    return { success: false, error: message };
  }
}
