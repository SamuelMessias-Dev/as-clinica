"use client";

import { createPortal } from "react-dom";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, DollarSign, PencilLine, Plus, Stethoscope, UserRound, X } from "lucide-react";
import { createAppointment, updateAppointment } from "@/lib/actions/appointments";
import type { AgendaAppointment } from "@/lib/data/agenda";
import type { CustomerProfile } from "@/lib/data/customers";
import type { ProfessionalProfile } from "@/lib/data/professionals";
import type { ProcedureCatalogItem } from "@/lib/data/procedures";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/mocks/dashboard";

type AppointmentMode = "create" | "edit";

type AppointmentFormState = {
  customerId: string;
  professionalId: string;
  procedureId: string;
  variationId: string;
  date: string;
  time: string;
  valueFinal: string;
  notes: string;
  origin: string;
  status: AppointmentStatus;
};

type AppointmentClockSpan = {
  start: number;
  end: number;
  id?: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatBrazilianCellphone(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatCurrencyInput(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return value.toFixed(2).replace(".", ",");
}

function parseCurrencyInput(value: string) {
  const cleaned = value.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDurationMinutes(duration: string | null | undefined) {
  if (!duration) return 60;

  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minuteMatch = duration.match(/(\d+)\s*min/i);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    return Math.max(hours * 60 + minutes, 15);
  }

  const firstNumber = duration.match(/\d+/);
  return firstNumber ? Math.max(Number(firstNumber[0]) || 60, 15) : 60;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function overlaps(spanA: AppointmentClockSpan, spanB: AppointmentClockSpan) {
  return spanA.start < spanB.end && spanB.start < spanA.end;
}

function getAppointmentSpan(appointment: AgendaAppointment, durationMinutes: number): AppointmentClockSpan | null {
  const startValue = appointment.dataInicio ?? (appointment.time ? `${appointment.date}T${appointment.time.length === 5 ? `${appointment.time}:00` : appointment.time}` : null);
  const start = startValue ? new Date(startValue) : null;

  if (!start || Number.isNaN(start.getTime())) return null;

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endFromStored = appointment.dataFim ? new Date(appointment.dataFim) : null;
  const endMinutes = endFromStored && !Number.isNaN(endFromStored.getTime())
    ? endFromStored.getHours() * 60 + endFromStored.getMinutes()
    : startMinutes + durationMinutes;

  return {
    start: startMinutes,
    end: endMinutes,
    id: appointment.id,
  };
}

function getWorkingSlots(startMinute = 8 * 60, endMinute = 18 * 60, step = 15) {
  const slots: string[] = [];
  for (let minute = startMinute; minute + step <= endMinute; minute += step) {
    slots.push(minutesToTime(minute));
  }
  return slots;
}

function isSpanInsideWindow(spanStart: number, spanEnd: number, windowStart: number, windowEnd: number) {
  return spanStart >= windowStart && spanEnd <= windowEnd;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultTime() {
  return "09:00";
}

function createBlankForm(initialDate?: string, initialTime?: string): AppointmentFormState {
  const today = getTodayDate();

  return {
    customerId: "",
    professionalId: "",
    procedureId: "",
    variationId: "",
    date: initialDate ?? today,
    time: initialTime ?? getDefaultTime(),
    valueFinal: "",
    notes: "",
    origin: "manual",
    status: "confirmado",
  };
}

function mapAppointmentToForm(appointment?: AgendaAppointment, initialDate?: string, initialTime?: string) {
  if (!appointment) {
    return createBlankForm(initialDate, initialTime);
  }

  return {
    customerId: appointment.leadId ? String(appointment.leadId) : "",
    professionalId: appointment.professionalId ? String(appointment.professionalId) : "",
    procedureId: appointment.procedureId ? String(appointment.procedureId) : "",
    variationId: appointment.variationId ? String(appointment.variationId) : "",
    date: appointment.date || initialDate || getTodayDate(),
    time: appointment.time || initialTime || getDefaultTime(),
    valueFinal: formatCurrencyInput(appointment.valueFinal),
    notes: appointment.notes ?? "",
    origin: appointment.origin ?? "manual",
    status: appointment.status ?? "confirmado",
  };
}

export function AppointmentModal({
  open,
  mode,
  appointment,
  initialDate,
  initialTime,
  initialCustomerId,
  initialProfessionalId,
  initialProcedureId,
  initialVariationId,
  customers,
  professionals,
  procedures,
  appointments = [],
  onClose,
}: {
  open: boolean;
  mode: AppointmentMode;
  appointment?: AgendaAppointment;
  initialDate?: string;
  initialTime?: string;
  initialCustomerId?: string;
  initialProfessionalId?: string;
  initialProcedureId?: string;
  initialVariationId?: string;
  customers: CustomerProfile[];
  professionals: ProfessionalProfile[];
  procedures: ProcedureCatalogItem[];
  appointments?: AgendaAppointment[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [portalReady, setPortalReady] = useState(false);
  const [mounted, setMounted] = useState(open);
  const [form, setForm] = useState<AppointmentFormState>(createBlankForm(initialDate, initialTime));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setForm(
        appointment
          ? mapAppointmentToForm(appointment, initialDate, initialTime)
          : {
              ...createBlankForm(initialDate, initialTime),
              customerId: initialCustomerId ?? "",
              professionalId: initialProfessionalId ?? "",
              procedureId: initialProcedureId ?? "",
              variationId: initialVariationId ?? "",
            },
      );
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => setMounted(false), 300);
    return () => window.clearTimeout(timer);
  }, [appointment, initialCustomerId, initialDate, initialProcedureId, initialProfessionalId, initialTime, initialVariationId, open]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer.id) === form.customerId),
    [customers, form.customerId],
  );

  const selectedProfessional = useMemo(
    () => professionals.find((professional) => String(professional.id) === form.professionalId),
    [form.professionalId, professionals],
  );

  const selectedProcedure = useMemo(
    () => procedures.find((procedure) => String(procedure.id) === form.procedureId),
    [form.procedureId, procedures],
  );

  const selectedVariation = useMemo(() => {
    if (!selectedProcedure) return null;
    return selectedProcedure.variations.find((variation) => String(variation.id) === form.variationId) ?? null;
  }, [form.variationId, selectedProcedure]);

  const selectedDurationMinutes = useMemo(
    () => parseDurationMinutes(selectedVariation?.duration ?? selectedProcedure?.baseDuration ?? null),
    [selectedProcedure?.baseDuration, selectedVariation?.duration],
  );

  const selectedDayOfWeek = useMemo(() => new Date(`${form.date || getTodayDate()}T12:00:00`).getDay(), [form.date]);

  const scheduleStart = selectedProfessional?.scheduleStart ?? "08:00";
  const scheduleEnd = selectedProfessional?.scheduleEnd ?? "18:00";
  const pauseStart = selectedProfessional?.pauseStart ?? "12:00";
  const pauseEnd = selectedProfessional?.pauseEnd ?? "13:00";
  const activeDays = selectedProfessional?.activeDays ?? [1, 2, 3, 4, 5];
  const isWorkingDay = activeDays.length > 0 ? activeDays.includes(selectedDayOfWeek) : true;

  const selectedProfessionalAppointments = useMemo(
    () =>
      appointments.filter(
        (item) =>
          item.status !== "cancelado" &&
          item.professionalId === Number(form.professionalId || 0) &&
          item.date === form.date &&
          (!appointment || item.id !== appointment.id),
      ),
    [appointment, appointments, form.date, form.professionalId],
  );

  const currentSpan = useMemo(() => {
    if (!form.time || !form.date || !form.professionalId) return null;
    const start = timeToMinutes(form.time);
    return { start, end: start + selectedDurationMinutes };
  }, [form.date, form.professionalId, form.time, selectedDurationMinutes]);

  const availability = useMemo(() => {
    if (!form.professionalId || !form.date || !selectedProcedure || !selectedProfessional) {
      return { freeSlots: [] as string[], isConflict: false, isWorkingDay: true };
    }

    const occupied = selectedProfessionalAppointments
      .map((item) => getAppointmentSpan(item, selectedDurationMinutes))
      .filter((item): item is AppointmentClockSpan => Boolean(item));

    if (!isWorkingDay) {
      return { freeSlots: [] as string[], isConflict: false, isWorkingDay: false };
    }

    const scheduleWindow = {
      start: timeToMinutes(scheduleStart),
      end: timeToMinutes(scheduleEnd),
    };
    const pauseWindow = pauseStart && pauseEnd ? { start: timeToMinutes(pauseStart), end: timeToMinutes(pauseEnd) } : null;

    const freeSlots = getWorkingSlots(scheduleWindow.start, scheduleWindow.end).filter((slot) => {
      const span = { start: timeToMinutes(slot), end: timeToMinutes(slot) + selectedDurationMinutes };
      const fitsWorkday = isSpanInsideWindow(span.start, span.end, scheduleWindow.start, scheduleWindow.end);
      const overlapsPause = pauseWindow ? overlaps(span, pauseWindow) : false;
      return fitsWorkday && !overlapsPause && !occupied.some((item) => overlaps(span, item));
    });

    const isConflict = currentSpan ? occupied.some((item) => overlaps(currentSpan, item)) : false;

    return {
      freeSlots: freeSlots.slice(0, 8),
      isConflict,
      isWorkingDay: true,
    };
  }, [currentSpan, form.date, form.professionalId, isWorkingDay, pauseEnd, pauseStart, scheduleEnd, scheduleStart, selectedDurationMinutes, selectedProfessional, selectedProfessionalAppointments, selectedProcedure]);

  useEffect(() => {
    if (!open || !selectedProcedure) return;

    if (!selectedProcedure.variations.length) {
      setForm((current) => (current.variationId ? { ...current, variationId: "" } : current));
      return;
    }

    const variationExists = selectedProcedure.variations.some((variation) => String(variation.id) === form.variationId);
    if (!variationExists) {
      setForm((current) => ({
        ...current,
        variationId: String(selectedProcedure.variations[0].id),
      }));
    }
  }, [form.variationId, open, selectedProcedure]);

  function closeDrawer() {
    if (isSubmitting) return;
    onClose();
  }

  function handleProcedureChange(procedureId: string) {
    const procedure = procedures.find((item) => String(item.id) === procedureId);
    const defaultVariation = procedure?.variations[0];
    const nextValue = defaultVariation?.price ?? procedure?.basePrice ?? null;

    setForm((current) => ({
      ...current,
      procedureId,
      variationId: defaultVariation ? String(defaultVariation.id) : "",
      valueFinal: nextValue === null ? current.valueFinal : formatCurrencyInput(nextValue),
    }));
  }

  function handleVariationChange(variationId: string) {
    const variation = selectedProcedure?.variations.find((item) => String(item.id) === variationId);
    const nextValue = variation?.price ?? selectedProcedure?.basePrice ?? null;

    setForm((current) => ({
      ...current,
      variationId,
      valueFinal: nextValue === null ? current.valueFinal : formatCurrencyInput(nextValue),
    }));
  }

  function pickSuggestedTime(value: string) {
    setForm((current) => ({ ...current, time: value }));
  }

  function buildPayload(nextStatus: AppointmentStatus) {
    if (!form.customerId || !form.professionalId || !form.procedureId || !form.date || !form.time) {
      setError("Preencha cliente, profissional, procedimento, data e horário.");
      return null;
    }

    const customer = selectedCustomer;
    const professional = selectedProfessional;
    const procedure = selectedProcedure;
    const variation = selectedVariation;

    if (!customer || !professional || !procedure) {
      setError("Não foi possível localizar os registros escolhidos.");
      return null;
    }

    const valueFinal = parseCurrencyInput(form.valueFinal) ?? variation?.price ?? procedure.basePrice ?? null;

    return {
      leadId: customer.id,
      professionalId: professional.id,
      procedureId: procedure.id,
      variationId: variation?.id ?? null,
      date: form.date,
      time: form.time,
      valueFinal,
      notes: form.notes,
      origin: form.origin,
      status: nextStatus,
      customerNameSnapshot: customer.name,
      customerCellphoneSnapshot: onlyDigits(customer.cellphone),
      professionalNameSnapshot: professional.name,
      procedureNameSnapshot: procedure.name,
      variationNameSnapshot: variation?.name ?? null,
    };
  }

  async function saveAppointment(nextStatus: AppointmentStatus = form.status) {
    const payload = buildPayload(nextStatus);
    if (!payload) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = mode === "edit" && appointment ? await updateAppointment(Number(appointment.id), payload) : await createAppointment(payload);

      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar o agendamento.");
        return;
      }

      onClose();
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Erro inesperado ao salvar.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "create" && !availability.isWorkingDay) {
      setError("Este profissional não atende nesse dia da semana.");
      return;
    }
    if (mode === "create" && availability.isConflict) {
      setError("Esse horário está ocupado. Escolha um horário livre sugerido.");
      return;
    }
    await saveAppointment(form.status);
  }

  async function handleCancelAppointment() {
    if (mode !== "edit" || !appointment || isSubmitting) return;

    const confirmed = window.confirm("Cancelar este agendamento? O horário ficará disponível novamente.");
    if (!confirmed) return;

    setForm((current) => ({ ...current, status: "cancelado" }));
    await saveAppointment("cancelado");
  }

  const canSubmit = !availability.isConflict || mode === "edit";

  if (!portalReady || !mounted) return null;

  const drawer = (
    <div className={cn("fixed inset-0 z-[100] h-dvh", open ? "pointer-events-auto" : "pointer-events-none")}>
      <button
        type="button"
        aria-label="Fechar agendamento"
        onClick={closeDrawer}
        className={cn("absolute inset-0 bg-black/25 transition-opacity duration-300 lg:bg-black/20", open ? "opacity-100" : "opacity-0")}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 flex h-dvh max-h-dvh w-[min(100vw,820px)] transform border-l bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <form onSubmit={handleSubmit} className="flex h-full w-full flex-col">
          <div className="border-b p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  {mode === "create" ? <Plus className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
                  {mode === "create" ? "Novo agendamento" : "Editar agendamento"}
                </p>
                <h2 className="text-xl font-semibold leading-tight sm:text-2xl">
                  {mode === "create" ? "Criar agendamento" : appointment?.customer ?? "Atualizar agendamento"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Preencha os dados principais, confirme o procedimento e salve direto no calendário da clínica.
                </p>
              </div>
              <Button aria-label="Fechar agendamento" variant="ghost" size="sm" className="h-9 w-9 px-0" onClick={closeDrawer} type="button">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="space-y-5">
              <section className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-semibold">Cliente e atendimento</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Escolha o cliente e o profissional que vai assumir o horário.</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={form.customerId} onValueChange={(value) => setForm((current) => ({ ...current, customerId: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={String(customer.id)}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCustomer ? (
                      <p className="text-xs text-muted-foreground">
                        {formatBrazilianCellphone(selectedCustomer.cellphone) || "Celular não informado"} · {selectedCustomer.email || "E-mail não informado"}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Profissional</Label>
                    <Select value={form.professionalId} onValueChange={(value) => setForm((current) => ({ ...current, professionalId: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {professionals.map((professional) => (
                          <SelectItem key={professional.id} value={String(professional.id)}>
                            {professional.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProfessional ? <p className="text-xs text-muted-foreground">{selectedProfessional.description || "Sem descrição"}</p> : null}
                  </div>
                </div>

                {selectedProfessional && form.date ? (
                  <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="font-medium">Horários livres sugeridos</h4>
                        <p className="text-sm text-muted-foreground">
                          {isWorkingDay
                            ? `Baseado em ${selectedDurationMinutes} min, na jornada ${scheduleStart} - ${scheduleEnd} e na pausa ${pauseStart} - ${pauseEnd}.`
                            : "Este profissional não atende nesse dia da semana."}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {selectedProfessionalAppointments.length} horário(s) ocupado(s) hoje
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {availability.freeSlots.length > 0 ? (
                        availability.freeSlots.map((slot) => (
                          <Button
                            key={slot}
                            type="button"
                            variant={form.time === slot ? "default" : "outline"}
                            size="sm"
                            className="h-9"
                            onClick={() => pickSuggestedTime(slot)}
                          >
                            {slot}
                          </Button>
                        ))
                      ) : !isWorkingDay ? (
                        <p className="text-sm text-muted-foreground">Nenhum horário disponível para esse dia.</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum horário livre encontrado nesse período.</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-semibold">Procedimento</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Selecione o procedimento principal e, se houver, a variação correspondente.</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Procedimento</Label>
                    <Select value={form.procedureId} onValueChange={handleProcedureChange}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecione o procedimento" />
                      </SelectTrigger>
                      <SelectContent>
                        {procedures.map((procedure) => (
                          <SelectItem key={procedure.id} value={String(procedure.id)}>
                            {procedure.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Variação</Label>
                    <Select
                      value={form.variationId}
                      onValueChange={handleVariationChange}
                      disabled={!selectedProcedure?.variations.length}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={selectedProcedure?.variations.length ? "Selecione a variação" : "Sem variação"} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProcedure?.variations.map((variation) => (
                          <SelectItem key={variation.id} value={String(variation.id)}>
                            {variation.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedProcedure ? (
                  <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-md border bg-white p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Duração
                        </div>
                        <p className="font-medium">{selectedVariation?.duration ?? selectedProcedure.baseDuration ?? "Não informada"}</p>
                      </div>
                      <div className="rounded-md border bg-white p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5" />
                          Valor sugerido
                        </div>
                        <p className="font-medium">
                          {selectedVariation?.price ?? selectedProcedure.basePrice ? formatCurrencyInput(selectedVariation?.price ?? selectedProcedure.basePrice) : "Não informado"}
                        </p>
                      </div>
                      <div className="rounded-md border bg-white p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <Stethoscope className="h-3.5 w-3.5" />
                          Descrição
                        </div>
                        <p className="line-clamp-2 text-sm">{selectedProcedure.description || "Sem descrição cadastrada."}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-semibold">Data, hora e financeiro</h3>
                  <p className="mt-1 text-sm text-muted-foreground">A data e o valor podem ser ajustados manualmente pela recepção.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointment-date">Data</Label>
                    <Input
                      id="appointment-date"
                      type="date"
                      value={form.date}
                      onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointment-time">Horário</Label>
                    <Input
                      id="appointment-time"
                      type="time"
                      value={form.time}
                      onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointment-value">Valor final</Label>
                    <Input
                      id="appointment-value"
                      value={form.valueFinal}
                      onChange={(event) => setForm((current) => ({ ...current, valueFinal: event.target.value }))}
                      placeholder="0,00"
                      inputMode="decimal"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as AppointmentStatus }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="aguardando">Aguardando</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Origem</Label>
                    <Select value={form.origin} onValueChange={(value) => setForm((current) => ({ ...current, origin: value }))}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="retorno">Retorno</SelectItem>
                        <SelectItem value="indicacao">Indicação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointment-notes">Observações</Label>
                    <textarea
                      id="appointment-notes"
                      value={form.notes}
                      onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                      className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2"
                      placeholder="Preferências, pacotes, restrições ou detalhes combinados."
                    />
                  </div>
                </div>
              </section>

              {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}
              {availability.isConflict ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Esse horário já está ocupado para o profissional selecionado. Escolha uma sugestão acima ou ajuste a hora.
                </div>
              ) : null}
              {selectedProfessional && !availability.isWorkingDay ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Este profissional não atende nesse dia da semana.
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {selectedCustomer?.name ?? "Cliente"} · {form.date || "--/--/----"} · {form.time || "--:--"}
                </span>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {mode === "edit" ? (
                  <Button type="button" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={handleCancelAppointment} disabled={isSubmitting}>
                    Cancelar agendamento
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={closeDrawer} disabled={isSubmitting}>
                  Fechar
                </Button>
                <Button type="submit" className="gap-2" disabled={isSubmitting || (!canSubmit && mode === "create")}>
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? "Salvando..." : mode === "create" ? "Criar agendamento" : "Salvar alterações"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}
