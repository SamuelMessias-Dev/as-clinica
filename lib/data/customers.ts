import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { Lead } from "@/lib/types/database";

export type CustomerProfile = {
  id: number;
  name: string;
  cellphone: string;
  email: string;
  description: string;
  photoUrl: string | null;
};

const fallbackCustomers: CustomerProfile[] = [
  {
    id: 1,
    name: "Marina Costa",
    cellphone: "(85) 98812-3400",
    email: "marina@email.com",
    description: "Cliente recorrente, interesse em limpeza de pele e pacotes mensais.",
    photoUrl: null,
  },
  {
    id: 2,
    name: "Renata Alves",
    cellphone: "(85) 99745-8801",
    email: "renata@email.com",
    description: "Busca drenagem linfática e atendimento em horários da tarde.",
    photoUrl: null,
  },
  {
    id: 3,
    name: "Beatriz Lima",
    cellphone: "(85) 99210-6614",
    email: "beatriz@email.com",
    description: "Interessada em massagem relaxante e retorno para avaliação.",
    photoUrl: null,
  },
];

function normalizeCustomer(customer: Lead): CustomerProfile {
  return {
    id: customer.id,
    name: customer.nome ?? "Cliente",
    cellphone: customer.numero_celular ?? "",
    email: customer.email ?? "",
    description: customer.descricao ?? "",
    photoUrl: customer.foto_url,
  };
}

export async function getCustomers() {
  if (!hasSupabaseConfig()) {
    return fallbackCustomers;
  }

  const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase leads query failed:", error.message);
    return fallbackCustomers;
  }

  const customers = (data ?? []) as Lead[];

  if (!customers.length) {
    return [];
  }

  return customers.map(normalizeCustomer);
}
