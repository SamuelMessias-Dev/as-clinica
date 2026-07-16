"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAvailabilityWindow,
  isSpanInsideWindow,
  overlaps,
  parseDurationMinutes,
  type WorkingDay,
} from "@/lib/scheduling/availability";
import type { Agendamento, ClinicWorkingHour, Database, Procedimento, ProcedimentoVariacao, Profissional } from "@/lib/types/database";

export type UpsertAppointmentData = {
  leadId: number;
  professionalId: number;
  procedureId: number;
  variationId: number | null;
  date: string;
  time: string;
  valueFinal: number | null;
  notes: string;
  origin: string;
  status: string;
  customerNameSnapshot: string;
  customerCellphoneSnapshot: string;
  professionalNameSnapshot: string;
  procedureNameSnapshot: string;
  variationNameSnapshot: string | null;
};

function buildLocalTimestamp(date: string, time: string) {
  return `${date}T${time.length === 5 ? `${time}:00` : time}`;
}

function parseLocalTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatLocalTimestamp(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function addMinutes(timestamp: Date, minutes: number) {
  return new Date(timestamp.getTime() + minutes * 60_000);
}

function normalizePayload(data: UpsertAppointmentData, timestamp: string, endTimestamp: string | null, endTime: string | null) {
  const localTimestamp = timestamp;

  return {
    lead: data.leadId,
    profissional_id: data.professionalId,
    procedimento: data.procedureId,
    variacao_procedimento: data.variationId,
    data: localTimestamp,
    data_inicio: localTimestamp,
    data_fim: endTimestamp,
    hora_inicio: data.time,
    hora_fim: endTime,
    status: data.status,
    observacoes: data.notes.trim(),
    valor_final: data.valueFinal,
    origem: data.origin,
    cliente_nome_snapshot: data.customerNameSnapshot,
    cliente_celular_snapshot: data.customerCellphoneSnapshot,
    profissional_nome_snapshot: data.professionalNameSnapshot,
    procedimento_nome_snapshot: data.procedureNameSnapshot,
    variacao_nome_snapshot: data.variationNameSnapshot,
  };
}

function buildAppointmentDurationMinutes(
  procedure?: Pick<Procedimento, "duracao"> | null,
  variation?: Pick<ProcedimentoVariacao, "duracao"> | null,
) {
  return parseDurationMinutes(variation?.duracao ?? procedure?.duracao);
}

function buildDurationMaps(procedures: Procedimento[], variations: ProcedimentoVariacao[]) {
  const proceduresById = new Map<number, Procedimento>();
  const variationsById = new Map<number, ProcedimentoVariacao>();

  for (const procedure of procedures) {
    proceduresById.set(procedure.id, procedure);
  }

  for (const variation of variations) {
    variationsById.set(variation.id, variation);
  }

  return { proceduresById, variationsById };
}

function buildAppointmentRange(date: string, time: string, durationMinutes: number) {
  const start = parseLocalTimestamp(buildLocalTimestamp(date, time));

  if (!start) {
    return { startTimestamp: buildLocalTimestamp(date, time), endTimestamp: null, endTime: null };
  }

  const end = addMinutes(start, durationMinutes);
  return {
    startTimestamp: formatLocalTimestamp(start),
    endTimestamp: formatLocalTimestamp(end),
    endTime: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
  };
}

async function loadAppointmentContext(supabase: SupabaseClient<Database>, data: UpsertAppointmentData) {
  const [proceduresResponse, variationsResponse, appointmentsResponse, professionalResponse, workingHoursResponse] = await Promise.all([
    supabase.from("procedimentos").select("*"),
    supabase.from("procedimento_variacao").select("*"),
    supabase.from("agendamento").select("*").eq("profissional_id", data.professionalId),
    supabase.from("profissionais").select("*").eq("id", data.professionalId).maybeSingle(),
    supabase.from("clinic_working_hours").select("*").eq("clinic_id", "as-estetica").order("weekday", { ascending: true }),
  ]);

  return {
    procedures: (proceduresResponse.data ?? []) as Procedimento[],
    variations: (variationsResponse.data ?? []) as ProcedimentoVariacao[],
    appointments: (appointmentsResponse.data ?? []) as Agendamento[],
    professional: (professionalResponse.data ?? null) as Profissional | null,
    workingHours: (workingHoursResponse.data ?? []) as ClinicWorkingHour[],
    errors: [proceduresResponse.error, variationsResponse.error, appointmentsResponse.error, professionalResponse.error, workingHoursResponse.error].filter(Boolean),
  };
}

function normalizeWorkingHours(rows: ClinicWorkingHour[]): WorkingDay[] {
  return rows.map((day) => ({
    weekday: day.weekday,
    isOpen: day.is_open,
    opensAt: day.opens_at ?? "",
    closesAt: day.closes_at ?? "",
    pauseStartsAt: day.pause_starts_at ?? "",
    pauseEndsAt: day.pause_ends_at ?? "",
  }));
}

function validateProfessionalAvailability(
  professional: Profissional | null,
  workingHours: ClinicWorkingHour[],
  date: string,
  start: Date,
  end: Date,
) {
  const availabilityWindow = getAvailabilityWindow(date, normalizeWorkingHours(workingHours), {
    scheduleStart: professional?.agenda_inicio ?? undefined,
    scheduleEnd: professional?.agenda_fim ?? undefined,
    pauseStart: professional?.agenda_pausa_inicio ?? undefined,
    pauseEnd: professional?.agenda_pausa_fim ?? undefined,
    activeDays: professional?.agenda_dias_semana ?? undefined,
  });
  const appointmentStart = start.getHours() * 60 + start.getMinutes();
  const appointmentEnd = end.getHours() * 60 + end.getMinutes();

  if (!availabilityWindow.isOpen) {
    return availabilityWindow.reason ?? "Não há atendimento disponível nesse dia.";
  }

  if (!isSpanInsideWindow(appointmentStart, appointmentEnd, availabilityWindow.start, availabilityWindow.end)) {
    return `O horário informado está fora do funcionamento disponível (${availabilityWindow.label}).`;
  }

  if (availabilityWindow.pauses.some((pause) => overlaps({ start: appointmentStart, end: appointmentEnd }, pause))) {
    return "O horário informado cai em um intervalo de pausa.";
  }

  return null;
}

function buildConflictLabel(appointment: Agendamento, currentCustomerName: string) {
  const customer = appointment.cliente_nome_snapshot ?? currentCustomerName ?? "outro cliente";
  const time = appointment.hora_inicio ?? appointment.data_inicio?.slice(11, 16) ?? "horário desconhecido";
  return `${customer} às ${time}`;
}

function hasOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}

export async function createAppointment(data: UpsertAppointmentData) {
  try {
    const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;
    const { procedures, variations, appointments, professional, workingHours, errors } = await loadAppointmentContext(supabase, data);

    if (errors.length) {
      const message = errors[0]?.message ?? "Erro ao consultar agenda.";
      console.error("Appointment context query failed:", message);
      return { success: false, error: message };
    }

    const { proceduresById, variationsById } = buildDurationMaps(procedures, variations);
    const selectedProcedure = proceduresById.get(data.procedureId) ?? null;
    const selectedVariation = data.variationId ? variationsById.get(data.variationId) ?? null : null;
    const durationMinutes = buildAppointmentDurationMinutes(selectedProcedure, selectedVariation);
    const range = buildAppointmentRange(data.date, data.time, durationMinutes);
    const start = parseLocalTimestamp(range.startTimestamp);
    const end = parseLocalTimestamp(range.endTimestamp);

    if (!start || !end) {
      return { success: false, error: "Não foi possível calcular o horário do agendamento." };
    }

    const availabilityError = validateProfessionalAvailability(professional, workingHours, data.date, start, end);
    if (availabilityError) {
      return { success: false, error: availabilityError };
    }

    const conflict = appointments
      .filter((appointment) => appointment.status !== "cancelado")
      .filter((appointment) => (appointment.data_inicio ?? appointment.data ?? "").slice(0, 10) === data.date)
      .map((appointment) => {
        const existingProcedure = appointment.procedimento ? proceduresById.get(appointment.procedimento) ?? null : null;
        const existingVariation = appointment.variacao_procedimento ? variationsById.get(appointment.variacao_procedimento) ?? null : null;
        const existingStart = parseLocalTimestamp(appointment.data_inicio ?? appointment.data);
        const existingDuration = buildAppointmentDurationMinutes(existingProcedure, existingVariation);
        const existingEnd = appointment.data_fim ? parseLocalTimestamp(appointment.data_fim) : existingStart ? addMinutes(existingStart, existingDuration) : null;

        return { appointment, existingStart, existingEnd };
      })
      .find(({ existingStart, existingEnd }) => {
        if (!existingStart || !existingEnd) return false;
        return hasOverlap(start, end, existingStart, existingEnd);
      });

    if (conflict?.appointment) {
      return {
        success: false,
        error: `Já existe um agendamento para esse profissional nesse horário (${buildConflictLabel(conflict.appointment, data.customerNameSnapshot)}).`,
      };
    }

    const payload = normalizePayload(data, range.startTimestamp, range.endTimestamp, range.endTime);

    const { data: newRow, error } = await supabase.from("agendamento").insert(payload).select().single();

    if (error) {
      console.error("DB insert error for appointment:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard/agendamentos");
    return { success: true, data: newRow };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    console.error("Server Action createAppointment error:", error);
    return { success: false, error: message };
  }
}

export async function updateAppointment(id: number, data: UpsertAppointmentData) {
  try {
    const supabase = ((await createClient()) as unknown) as SupabaseClient<Database>;
    const { procedures, variations, appointments, professional, workingHours, errors } = await loadAppointmentContext(supabase, data);

    if (errors.length) {
      const message = errors[0]?.message ?? "Erro ao consultar agenda.";
      console.error("Appointment context query failed:", message);
      return { success: false, error: message };
    }

    const { proceduresById, variationsById } = buildDurationMaps(procedures, variations);
    const selectedProcedure = proceduresById.get(data.procedureId) ?? null;
    const selectedVariation = data.variationId ? variationsById.get(data.variationId) ?? null : null;
    const durationMinutes = buildAppointmentDurationMinutes(selectedProcedure, selectedVariation);
    const range = buildAppointmentRange(data.date, data.time, durationMinutes);
    const start = parseLocalTimestamp(range.startTimestamp);
    const end = parseLocalTimestamp(range.endTimestamp);

    if (!start || !end) {
      return { success: false, error: "Não foi possível calcular o horário do agendamento." };
    }

    const availabilityError = validateProfessionalAvailability(professional, workingHours, data.date, start, end);
    if (availabilityError) {
      return { success: false, error: availabilityError };
    }

    const conflict = appointments
      .filter((appointment) => appointment.status !== "cancelado")
      .filter((appointment) => String(appointment.id) !== String(id))
      .filter((appointment) => (appointment.data_inicio ?? appointment.data ?? "").slice(0, 10) === data.date)
      .map((appointment) => {
        const existingProcedure = appointment.procedimento ? proceduresById.get(appointment.procedimento) ?? null : null;
        const existingVariation = appointment.variacao_procedimento ? variationsById.get(appointment.variacao_procedimento) ?? null : null;
        const existingStart = parseLocalTimestamp(appointment.data_inicio ?? appointment.data);
        const existingDuration = buildAppointmentDurationMinutes(existingProcedure, existingVariation);
        const existingEnd = appointment.data_fim ? parseLocalTimestamp(appointment.data_fim) : existingStart ? addMinutes(existingStart, existingDuration) : null;

        return { appointment, existingStart, existingEnd };
      })
      .find(({ existingStart, existingEnd }) => {
        if (!existingStart || !existingEnd) return false;
        return hasOverlap(start, end, existingStart, existingEnd);
      });

    if (conflict?.appointment) {
      return {
        success: false,
        error: `Já existe um agendamento para esse profissional nesse horário (${buildConflictLabel(conflict.appointment, data.customerNameSnapshot)}).`,
      };
    }

    const payload = normalizePayload(data, range.startTimestamp, range.endTimestamp, range.endTime);

    const { data: updatedRow, error } = await supabase
      .from("agendamento")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("DB update error for appointment ID:", id, error);
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/agenda");
    revalidatePath("/dashboard/agendamentos");
    return { success: true, data: updatedRow };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno do servidor.";
    console.error("Server Action updateAppointment error:", error);
    return { success: false, error: message };
  }
}
