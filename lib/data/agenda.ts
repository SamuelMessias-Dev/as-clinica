import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { Agendamento, Procedimento, ProcedimentoVariacao, Profissional, Lead } from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import type { DashboardProfessional, AppointmentStatus } from "@/lib/mocks/dashboard";

export type AgendaAppointment = {
  id: string;
  date: string;
  time: string;
  customer: string;
  phone: string;
  service: string;
  professional: string;
  status: AppointmentStatus;
  leadId: number | null;
  professionalId: number | null;
  procedureId: number | null;
  variationId: number | null;
  dataInicio: string | null;
  dataFim: string | null;
  valueFinal: number | null;
  origin: string | null;
  notes?: string;
};

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toTimeLabel(value: string | null, fallback?: string | null) {
  const raw = value ?? fallback ?? "";
  if (!raw) return "";
  if (raw.length >= 5) return raw.slice(0, 5);
  return raw;
}

function getAppointmentDate(row: Pick<Agendamento, "data" | "data_inicio">) {
  return (row.data_inicio ?? row.data ?? "").slice(0, 10);
}

function formatAppointmentTime(row: Pick<Agendamento, "hora_inicio" | "data_inicio" | "data">) {
  if (row.hora_inicio) return toTimeLabel(row.hora_inicio);
  const timestamp = row.data_inicio ?? row.data;
  if (!timestamp) return "";

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function buildAppointmentLabel(
  procedure?: Procedimento | null,
  variation?: ProcedimentoVariacao | null,
  snapshots?: Pick<Agendamento, "procedimento_nome_snapshot" | "variacao_nome_snapshot">
) {
  const procedureName = procedure?.nome ?? snapshots?.procedimento_nome_snapshot ?? "Procedimento";
  const variationName = variation?.nome ?? snapshots?.variacao_nome_snapshot;
  return variationName ? `${procedureName} - ${variationName}` : procedureName;
}

function buildCustomerPhone(lead?: Lead | null, snapshots?: Pick<Agendamento, "cliente_celular_snapshot">) {
  return lead?.numero_celular ?? snapshots?.cliente_celular_snapshot ?? "";
}

function buildCustomerName(lead?: Lead | null, snapshots?: Pick<Agendamento, "cliente_nome_snapshot">) {
  return lead?.nome ?? snapshots?.cliente_nome_snapshot ?? "Cliente";
}

function buildProfessionalName(professional?: Profissional | null, snapshots?: Pick<Agendamento, "profissional_nome_snapshot">) {
  return professional?.nome ?? snapshots?.profissional_nome_snapshot ?? "Profissional";
}

function emptyAgendaData() {
  return {
    appointments: [] as AgendaAppointment[],
    professionals: [] as { id: string; name: string; role: string; nextAvailable: string; todayAppointments: number }[],
  };
}

export async function getAgendaWorkspaceData() {
  if (!hasSupabaseConfig()) {
    return emptyAgendaData();
  }

  const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;

  const [{ data: appointmentsData, error: appointmentsError }, { data: leadsData, error: leadsError }, { data: professionalsData, error: professionalsError }, { data: proceduresData, error: proceduresError }, { data: variationsData, error: variationsError }] = await Promise.all([
    supabase.from("agendamento").select("*").order("data_inicio", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("leads").select("*"),
    supabase.from("profissionais").select("*"),
    supabase.from("procedimentos").select("*"),
    supabase.from("procedimento_variacao").select("*"),
  ]);

  if (appointmentsError || leadsError || professionalsError || proceduresError || variationsError) {
    console.error("Supabase agenda query failed:", appointmentsError?.message ?? leadsError?.message ?? professionalsError?.message ?? proceduresError?.message ?? variationsError?.message);
    return emptyAgendaData();
  }

  const leadsById = new Map<number, Lead>((leadsData ?? []).map((lead) => [lead.id, lead as Lead]));
  const professionalsById = new Map<number, Profissional>((professionalsData ?? []).map((professional) => [professional.id, professional as Profissional]));
  const proceduresById = new Map<number, Procedimento>((proceduresData ?? []).map((procedure) => [procedure.id, procedure as Procedimento]));
  const variationsById = new Map<number, ProcedimentoVariacao>((variationsData ?? []).map((variation) => [variation.id, variation as ProcedimentoVariacao]));

  const appointments = (appointmentsData ?? []).map((row) => {
    const appointment = row as Agendamento;
    const lead = appointment.lead ? leadsById.get(appointment.lead) : null;
    const professional = appointment.profissional_id ? professionalsById.get(appointment.profissional_id) : null;
    const procedure = appointment.procedimento ? proceduresById.get(appointment.procedimento) : null;
    const variation = appointment.variacao_procedimento ? variationsById.get(appointment.variacao_procedimento) : null;

    return {
      id: String(appointment.id),
      date: getAppointmentDate(appointment) || toYmd(new Date(appointment.created_at)),
      time: formatAppointmentTime(appointment) || "00:00",
      customer: buildCustomerName(lead, appointment),
      phone: buildCustomerPhone(lead, appointment),
      service: buildAppointmentLabel(procedure, variation, appointment),
      professional: buildProfessionalName(professional, appointment),
      status: (appointment.status as AppointmentStatus) ?? "confirmado",
      leadId: appointment.lead,
      professionalId: appointment.profissional_id,
      procedureId: appointment.procedimento,
      variationId: appointment.variacao_procedimento,
      dataInicio: appointment.data_inicio,
      dataFim: appointment.data_fim,
      valueFinal: appointment.valor_final,
      origin: appointment.origem,
      notes: appointment.observacoes ?? undefined,
    };
  });

  const professionals: DashboardProfessional[] = (professionalsData ?? []).map((professional) => ({
    id: String(professional.id),
    name: professional.nome ?? "Profissional",
    role: professional.descricao ?? "Profissional",
    nextAvailable: "Agora",
    todayAppointments: appointments.filter((appointment) => appointment.professionalId === Number(professional.id)).length,
  }));

  return {
    appointments,
    professionals,
  };
}
