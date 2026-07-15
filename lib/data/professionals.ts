import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { Profissional } from "@/lib/types/database";

export type ProfessionalProfile = {
  id: number;
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

const fallbackProfessionals: ProfessionalProfile[] = [
  {
    id: 1,
    name: "Dra. Larissa",
    cellphone: "(85) 98812-3400",
    email: "larissa@clinicabela.com",
    description: "Esteticista responsável pelos protocolos faciais e pela supervisão dos atendimentos.",
    photoUrl: null,
    scheduleStart: "08:00",
    scheduleEnd: "18:00",
    pauseStart: "12:00",
    pauseEnd: "13:00",
    activeDays: [1, 2, 3, 4, 5],
  },
  {
    id: 2,
    name: "Camila Rocha",
    cellphone: "(85) 99745-8801",
    email: "camila@clinicabela.com",
    description: "Massoterapeuta focada em drenagem, relaxamento e atendimento de recorrência.",
    photoUrl: null,
    scheduleStart: "08:00",
    scheduleEnd: "18:00",
    pauseStart: "12:00",
    pauseEnd: "13:00",
    activeDays: [1, 2, 3, 4, 5],
  },
  {
    id: 3,
    name: "Paula Nogueira",
    cellphone: "(85) 99120-3322",
    email: "paula@clinicabela.com",
    description: "Recepção e apoio operacional da agenda, contatos e confirmações.",
    photoUrl: null,
    scheduleStart: "08:00",
    scheduleEnd: "18:00",
    pauseStart: "12:00",
    pauseEnd: "13:00",
    activeDays: [1, 2, 3, 4, 5],
  },
];

function normalizeProfessional(professional: Profissional): ProfessionalProfile {
  return {
    id: professional.id,
    name: professional.nome ?? "Profissional",
    cellphone: professional.celular ?? "",
    email: professional.email ?? "",
    description: professional.descricao ?? "",
    photoUrl: professional.foto_url,
    scheduleStart: professional.agenda_inicio ?? "08:00",
    scheduleEnd: professional.agenda_fim ?? "18:00",
    pauseStart: professional.agenda_pausa_inicio ?? "12:00",
    pauseEnd: professional.agenda_pausa_fim ?? "13:00",
    activeDays: professional.agenda_dias_semana ?? [1, 2, 3, 4, 5],
  };
}

export async function getProfessionals() {
  if (!hasSupabaseConfig()) {
    return fallbackProfessionals;
  }

  const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;
  const { data, error } = await supabase
    .from("profissionais")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase profissionais query failed:", error.message);
    return fallbackProfessionals;
  }

  const professionals = (data ?? []) as Profissional[];

  if (!professionals.length) {
    return [];
  }

  return professionals.map(normalizeProfessional);
}
