"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type UpsertCustomerData = {
  name: string;
  cellphone: string;
  email: string;
  description: string;
  photoUrl: string | null;
};

function normalizeCustomerPayload(data: UpsertCustomerData) {
  return {
    nome: data.name.trim(),
    numero_celular: data.cellphone.replace(/\D/g, ""),
    email: data.email.trim().toLowerCase(),
    descricao: data.description.trim(),
    foto_url: data.photoUrl,
  };
}

export async function createLead(data: UpsertCustomerData) {
  try {
    const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;
    const payload = normalizeCustomerPayload(data);

    const { data: newRow, error } = await supabase
      .from("leads")
      .insert({
        ...payload,
        ultimo_contato: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("DB insert error for lead:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/clientes");
    return { success: true, data: newRow };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    console.error("Server Action createLead error:", error);
    return { success: false, error: message };
  }
}

export async function updateLead(id: number, data: UpsertCustomerData) {
  try {
    const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;
    const payload = normalizeCustomerPayload(data);

    const { data: updatedRow, error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("DB update error for lead ID:", id, error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/clientes");
    return { success: true, data: updatedRow };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    console.error("Server Action updateLead error:", error);
    return { success: false, error: message };
  }
}
