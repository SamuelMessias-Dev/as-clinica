"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

export type UpdateVariationData = {
  name: string;
  duration: string | null;
  price: number | null;
  examples: string | null;
};

export async function updateProcedureVariation(
  variationId: number,
  data: UpdateVariationData
) {
  try {
    const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;

    const { error } = await supabase
      .from("procedimento_variacao")
      .update({
        nome: data.name,
        duracao: data.duration,
        valor: data.price,
        exemplos: data.examples,
      })
      .eq("id", variationId);

    if (error) {
      console.error("DB update error for variation ID:", variationId, error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/servicos");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    console.error("Server Action updateProcedureVariation error:", error);
    return { success: false, error: message };
  }
}

export type CreateProcedureData = {
  name: string;
  description: string | null;
  duration: string | null;
  price: number | null;
};

export async function createProcedure(data: CreateProcedureData) {
  try {
    const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;

    const { data: newRow, error } = await supabase
      .from("procedimentos")
      .insert({
        nome: data.name,
        descricao: data.description,
        duracao: data.duration,
        valor: data.price,
        ativo: true,
        possui_variacao: false,
      })
      .select()
      .single();

    if (error) {
      console.error("DB insert error for procedure:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/servicos");
    return { success: true, data: newRow };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    console.error("Server Action createProcedure error:", error);
    return { success: false, error: message };
  }
}

// Soft delete: marca o procedimento como inativo (ativo = false)
export async function deactivateProcedure(procedureId: number) {
  try {
    const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;

    const { error } = await supabase
      .from("procedimentos")
      .update({ ativo: false })
      .eq("id", procedureId);

    if (error) {
      console.error("DB deactivate error for procedure ID:", procedureId, error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/servicos");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    console.error("Server Action deactivateProcedure error:", error);
    return { success: false, error: message };
  }
}

// Hard delete para variações (tabela não possui campo ativo)
export async function deleteVariation(variationId: number) {
  try {
    const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;

    const { error } = await supabase
      .from("procedimento_variacao")
      .delete()
      .eq("id", variationId);

    if (error) {
      console.error("DB delete error for variation ID:", variationId, error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/servicos");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    console.error("Server Action deleteVariation error:", error);
    return { success: false, error: message };
  }
}
