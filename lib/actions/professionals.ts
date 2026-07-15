"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type UpsertProfessionalData = {
  name: string;
  cellphone: string;
  email: string;
  description: string;
  photoUrl: string | null;
  scheduleStart: string;
  scheduleEnd: string;
  pauseStart: string;
  pauseEnd: string;
  activeDays: number[];
};

function normalizeProfessionalPayload(data: UpsertProfessionalData) {
  return {
    nome: data.name.trim(),
    celular: data.cellphone.replace(/\D/g, ""),
    email: data.email.trim().toLowerCase(),
    descricao: data.description.trim(),
    foto_url: data.photoUrl,
    agenda_inicio: data.scheduleStart,
    agenda_fim: data.scheduleEnd,
    agenda_pausa_inicio: data.pauseStart,
    agenda_pausa_fim: data.pauseEnd,
    agenda_dias_semana: data.activeDays,
  };
}

export async function createProfessional(data: UpsertProfessionalData) {
  try {
    const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;

    const payload = normalizeProfessionalPayload(data);

    const { data: newRow, error } = await supabase
      .from("profissionais")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("DB insert error for professional:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/profissionais");
    return { success: true, data: newRow };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    console.error("Server Action createProfessional error:", error);
    return { success: false, error: message };
  }
}

export async function updateProfessional(id: number, data: UpsertProfessionalData) {
  try {
    const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;

    const payload = normalizeProfessionalPayload(data);

    const { data: updatedRow, error } = await supabase
      .from("profissionais")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("DB update error for professional ID:", id, error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/profissionais");
    return { success: true, data: updatedRow };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    console.error("Server Action updateProfessional error:", error);
    return { success: false, error: message };
  }
}
