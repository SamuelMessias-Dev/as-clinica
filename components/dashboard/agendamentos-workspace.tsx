"use client";

import { CalendarPlus, Clock3, Plus, SlidersHorizontal, X } from "lucide-react";
import { createPortal } from "react-dom";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createAppointment } from "@/lib/actions/appointments";
import type { AgendaAppointment } from "@/lib/data/agenda";
import type { CustomerProfile } from "@/lib/data/customers";
import type { ProfessionalProfile } from "@/lib/data/professionals";
import type { ProcedureCatalogItem } from "@/lib/data/procedures";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/mocks/dashboard";
import {
  buildAvailableSlots,
  getAvailabilityWindow,
  overlaps,
  parseDurationMinutes,
  timeToMinutes,
  type ClockSpan,
  type WorkingDay,
} from "@/lib/scheduling/availability";

type DrawerFormState = {
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

type DrawerState = {
  open: boolean;
  mode: "create";
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
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

function todayDate() {
  const now = new Date();
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPhone(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function createBlankForm(date = todayDate()): DrawerFormState {
  return {
    customerId: "",
    professionalId: "",
    procedureId: "",
    variationId: "",
    date,
    time: "09:00",
    valueFinal: "",
    notes: "",
    origin: "manual",
    status: "confirmado",
  };
}

function getAppointmentSpan(appointment: AgendaAppointment, durationMinutes: number): ClockSpan | null {
  const startValue = appointment.dataInicio ?? `${appointment.date}T${appointment.time.length === 5 ? `${appointment.time}:00` : appointment.time}`;
  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return null;

  const end = appointment.dataFim ? new Date(appointment.dataFim) : null;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end && !Number.isNaN(end.getTime()) ? end.getHours() * 60 + end.getMinutes() : startMinutes + durationMinutes;

  return { id: appointment.id, start: startMinutes, end: endMinutes };
}

export function AgendamentosWorkspace({
  appointments = [],
  customers = [],
  professionalOptions = [],
  procedures = [],
  workingHours = [],
}: {
  appointments?: AgendaAppointment[];
  customers?: CustomerProfile[];
  professionalOptions?: ProfessionalProfile[];
  procedures?: ProcedureCatalogItem[];
  workingHours?: WorkingDay[];
}) {
  const router = useRouter();
  const [portalReady, setPortalReady] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerState, setDrawerState] = useState<DrawerState>({ open: false, mode: "create" });
  const [form, setForm] = useState<DrawerFormState>(createBlankForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [periodFilter, setPeriodFilter] = useState<"all" | "today" | "upcoming" | "past">("all");
  const [professionalFilter, setProfessionalFilter] = useState("all");

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (drawerState.open) {
      setDrawerMounted(true);
      return;
    }

    const timer = window.setTimeout(() => setDrawerMounted(false), 300);
    return () => window.clearTimeout(timer);
  }, [drawerState.open]);

  const today = todayDate();
  const todayAppointments = useMemo(() => appointments.filter((appointment) => appointment.date === today), [appointments, today]);

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesQuery =
        !query ||
        appointment.customer.toLowerCase().includes(query) ||
        appointment.service.toLowerCase().includes(query) ||
        appointment.professional.toLowerCase().includes(query) ||
        appointment.phone.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      const matchesProfessional = professionalFilter === "all" || String(appointment.professionalId ?? "") === professionalFilter;
      const matchesPeriod =
        periodFilter === "all"
          ? true
          : periodFilter === "today"
            ? appointment.date === today
            : periodFilter === "upcoming"
              ? appointment.date >= today
              : appointment.date < today;

      return matchesQuery && matchesStatus && matchesProfessional && matchesPeriod;
    });
  }, [appointments, periodFilter, professionalFilter, search, statusFilter, today]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer.id) === form.customerId),
    [customers, form.customerId],
  );

  const selectedProfessional = useMemo(
    () => professionalOptions.find((professional) => String(professional.id) === form.professionalId),
    [form.professionalId, professionalOptions],
  );

  const selectedProcedure = useMemo(
    () => procedures.find((procedure) => String(procedure.id) === form.procedureId),
    [form.procedureId, procedures],
  );

  const selectedVariation = useMemo(() => {
    if (!selectedProcedure) return null;
    return selectedProcedure.variations.find((variation) => String(variation.id) === form.variationId) ?? null;
  }, [form.variationId, selectedProcedure]);

  const selectedDuration = useMemo(
    () => selectedVariation?.duration ?? selectedProcedure?.baseDuration ?? "Não informado",
    [selectedProcedure?.baseDuration, selectedVariation?.duration],
  );

  const selectedDurationMinutes = useMemo(
    () => parseDurationMinutes(selectedVariation?.duration ?? selectedProcedure?.baseDuration ?? null),
    [selectedProcedure?.baseDuration, selectedVariation?.duration],
  );

  const selectedValue = useMemo(
    () => {
      const base = selectedVariation?.price ?? selectedProcedure?.basePrice ?? null;
      return parseCurrencyInput(form.valueFinal) ?? base;
    },
    [form.valueFinal, selectedProcedure?.basePrice, selectedVariation?.price],
  );

  const selectedProfessionalAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status !== "cancelado" &&
          appointment.professionalId === Number(form.professionalId || 0) &&
          appointment.date === form.date,
      ),
    [appointments, form.date, form.professionalId],
  );

  const availabilityWindow = useMemo(
    () => getAvailabilityWindow(form.date || today, workingHours, selectedProfessional),
    [form.date, selectedProfessional, today, workingHours],
  );

  const availability = useMemo(() => {
    if (!form.professionalId || !form.date || !selectedProcedure || !selectedProfessional) {
      return { freeSlots: [] as string[], isConflict: false, isWorkingDay: true };
    }

    const occupied = selectedProfessionalAppointments
      .map((appointment) => getAppointmentSpan(appointment, selectedDurationMinutes))
      .filter((item): item is ClockSpan => Boolean(item));

    if (!availabilityWindow.isOpen) {
      return { freeSlots: [] as string[], isConflict: false, isWorkingDay: false };
    }

    const freeSlots = buildAvailableSlots({
      window: availabilityWindow,
      durationMinutes: selectedDurationMinutes,
      occupied,
    });
    const currentSpan = form.time ? { start: timeToMinutes(form.time), end: timeToMinutes(form.time) + selectedDurationMinutes } : null;
    const isConflict = currentSpan
      ? !freeSlots.includes(form.time) || occupied.some((item) => overlaps(currentSpan, item))
      : false;

    return {
      freeSlots: freeSlots.slice(0, 12),
      isConflict,
      isWorkingDay: true,
    };
  }, [availabilityWindow, form.date, form.professionalId, form.time, selectedDurationMinutes, selectedProfessional, selectedProfessionalAppointments, selectedProcedure]);

  function openDrawer() {
    setForm(createBlankForm(today));
    setError(null);
    setDrawerState({ open: true, mode: "create" });
  }

  function closeDrawer() {
    if (isSubmitting) return;
    setDrawerState({ open: false, mode: "create" });
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.customerId || !form.professionalId || !form.procedureId || !form.date || !form.time) {
      setError("Preencha cliente, profissional, procedimento, data e horário.");
      return;
    }

    if (!availability.isWorkingDay) {
      setError(availabilityWindow.reason ?? "Não há atendimento disponível nesse dia.");
      return;
    }

    if (availability.isConflict) {
      setError("Esse horário está ocupado ou fora do funcionamento. Escolha um horário livre sugerido.");
      return;
    }

    const customer = selectedCustomer;
    const professional = selectedProfessional;
    const procedure = selectedProcedure;
    const variation = selectedVariation;

    if (!customer || !professional || !procedure) {
      setError("Não foi possível localizar os registros escolhidos.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createAppointment({
        leadId: customer.id,
        professionalId: professional.id,
        procedureId: procedure.id,
        variationId: variation?.id ?? null,
        date: form.date,
        time: form.time,
        valueFinal: selectedValue ?? null,
        notes: form.notes,
        origin: form.origin,
        status: form.status,
        customerNameSnapshot: customer.name,
        customerCellphoneSnapshot: onlyDigits(customer.cellphone),
        professionalNameSnapshot: professional.name,
        procedureNameSnapshot: procedure.name,
        variationNameSnapshot: variation?.name ?? null,
      });

      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar o agendamento.");
        return;
      }

      setDrawerState({ open: false, mode: "create" });
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const drawer = (
    <div className={cn("fixed inset-0 z-[100] h-dvh", drawerState.open ? "pointer-events-auto" : "pointer-events-none")}>
      <button
        type="button"
        aria-label="Fechar formulário"
        onClick={closeDrawer}
        className={cn("absolute inset-0 bg-black/25 transition-opacity duration-300 lg:bg-black/20", drawerState.open ? "opacity-100" : "opacity-0")}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 flex h-dvh max-h-dvh w-[min(100vw,780px)] transform border-l bg-white shadow-2xl transition-transform duration-300 ease-out",
          drawerState.open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <form onSubmit={submit} className="flex h-full w-full flex-col">
          <div className="border-b p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <CalendarPlus className="h-4 w-4" />
                  Novo agendamento
                </p>
                <h2 className="text-xl font-semibold leading-tight sm:text-2xl">Agendamento rápido</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Um fluxo direto para a recepção preencher o essencial e salvar sem sair da tela.
                </p>
              </div>
              <Button aria-label="Fechar formulário" variant="ghost" size="sm" className="h-9 w-9 px-0" onClick={closeDrawer} type="button">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-5">
                <section className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="mb-4">
                    <h3 className="font-semibold">1. Cliente e atendimento</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Primeiro escolha o cliente, o profissional e o procedimento.</p>
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
                          {formatPhone(selectedCustomer.cellphone) || "Celular não informado"} · {selectedCustomer.email || "E-mail não informado"}
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
                          {professionalOptions.map((professional) => (
                            <SelectItem key={professional.id} value={String(professional.id)}>
                              {professional.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedProfessional ? <p className="text-xs text-muted-foreground">{selectedProfessional.description || "Sem descrição"}</p> : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
                      <Select value={form.variationId} onValueChange={handleVariationChange} disabled={!selectedProcedure?.variations.length}>
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
                </section>

                <section className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="mb-4">
                    <h3 className="font-semibold">2. Data e horário</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Escolha o dia e o horário de forma objetiva.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="appointment-date">Data</Label>
                      <Input id="appointment-date" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="h-11" />
                    </div>

                    <div className="space-y-2">
                      <div>
                        <Label>Horário</Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {availabilityWindow.isOpen
                            ? `Funcionamento disponível: ${availabilityWindow.label}`
                            : availabilityWindow.reason ?? "Sem funcionamento para este dia."}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                        {availability.freeSlots.length > 0 ? availability.freeSlots.map((option) => {
                          const active = form.time === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setForm((current) => ({ ...current, time: option }))}
                              className={cn(
                                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                                active ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted",
                              )}
                            >
                              {option}
                            </button>
                          );
                        }) : (
                          <div className="col-span-full rounded-md border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
                            {form.professionalId && form.procedureId
                              ? "Nenhum horário livre encontrado para essa combinação."
                              : "Selecione profissional e procedimento para calcular os horários livres."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="mb-4">
                    <h3 className="font-semibold">3. Observações</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Informações extras ou combinações feitas com a recepção.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
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
                      <Label>Origem</Label>
                      <Select value={form.origin} onValueChange={(value) => setForm((current) => ({ ...current, origin: value }))}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="retorno">Retorno</SelectItem>
                          <SelectItem value="indicacao">Indicação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
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
                    Esse horário já está ocupado, cai em pausa ou está fora do funcionamento da clínica.
                  </div>
                ) : null}
              </div>

              <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
                <Card>
                  <CardContent className="space-y-4 p-4">
                    <div>
                      <p className="text-sm font-semibold">Resumo rápido</p>
                      <p className="mt-1 text-sm text-muted-foreground">Confira antes de salvar.</p>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-md border p-3 text-sm">
                        <p className="text-xs text-muted-foreground">Cliente</p>
                        <p className="mt-1 font-medium">{selectedCustomer?.name ?? "Selecione um cliente"}</p>
                      </div>
                      <div className="rounded-md border p-3 text-sm">
                        <p className="text-xs text-muted-foreground">Procedimento</p>
                        <p className="mt-1 font-medium">{selectedProcedure?.name ?? "Selecione um procedimento"}</p>
                      </div>
                      <div className="rounded-md border p-3 text-sm">
                        <p className="text-xs text-muted-foreground">Duração</p>
                        <p className="mt-1 font-medium">{selectedDuration}</p>
                      </div>
                      <div className="rounded-md border p-3 text-sm">
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="mt-1 font-medium">
                          {selectedValue === null || selectedValue === undefined
                            ? "Não informado"
                            : selectedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Visão do dia</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{todayAppointments.length} agendamento(s) registrados hoje.</p>
                    <div className="space-y-2">
                      {todayAppointments.slice(0, 3).map((appointment) => (
                        <div key={appointment.id} className="rounded-md border bg-muted/20 p-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{appointment.time}</p>
                            <span className="text-xs text-muted-foreground">{appointment.status}</span>
                          </div>
                          <p className="mt-1 truncate text-muted-foreground">{appointment.customer}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button className="h-11 w-full gap-2" type="submit" disabled={isSubmitting || availability.isConflict || !availability.isWorkingDay}>
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? "Salvando..." : "Salvar agendamento"}
                </Button>
              </aside>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agendamentos"
        description="Organize a fila do dia, confirme presenças e encontre rapidamente o contato de cada cliente."
        actions={
          <>
            <Button className="flex-1 gap-2 sm:flex-none" onClick={openDrawer}>
              <CalendarPlus className="h-4 w-4" />
              Novo
            </Button>
            <Button className="flex-1 gap-2 sm:flex-none" variant="outline" onClick={() => setFiltersOpen((current) => !current)} type="button">
              <SlidersHorizontal className="h-4 w-4" />
              Filtrar
            </Button>
          </>
        }
      />

      {filtersOpen ? (
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="appointment-search">Buscar</Label>
                <Input
                  id="appointment-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cliente, serviço, profissional ou telefone"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="aguardando">Aguardando</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as typeof periodFilter)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="upcoming">Próximos</SelectItem>
                    <SelectItem value="past">Passados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label>Profissional</Label>
                <Select value={professionalFilter} onValueChange={setProfessionalFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Todos os profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    {professionalOptions.map((professional) => (
                      <SelectItem key={professional.id} value={String(professional.id)}>
                        {professional.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 w-full"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setPeriodFilter("all");
                    setProfessionalFilter("all");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="hidden grid-cols-[88px_1.1fr_1fr_1fr_120px] gap-4 border-b bg-muted/60 px-4 py-3 text-xs font-medium uppercase text-muted-foreground lg:grid">
          <span>Hora</span>
          <span>Cliente</span>
          <span>Serviço</span>
          <span>Profissional</span>
          <span>Status</span>
        </div>
        <div className="divide-y">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="grid gap-3 p-4 lg:grid-cols-[88px_1.1fr_1fr_1fr_120px] lg:items-center">
                <div className="flex items-center justify-between gap-3 lg:block">
                  <span className="rounded-md bg-muted px-3 py-1.5 text-sm font-semibold">{appointment.time}</span>
                  <span className="inline-flex rounded-full border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground lg:hidden">
                    {appointment.status}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">{appointment.customer}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{appointment.phone}</p>
                </div>
                <p className="text-sm text-muted-foreground lg:text-foreground">{appointment.service}</p>
                <p className="text-sm text-muted-foreground lg:text-foreground">{appointment.professional}</p>
                <span className="hidden rounded-full border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground lg:inline-flex">
                  {appointment.status}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              Nenhum agendamento encontrado para os filtros atuais. Use o botão <span className="font-medium text-foreground">Novo</span> para começar.
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Resumo da lista</p>
            <p className="text-sm text-muted-foreground">
              {filteredAppointments.length} resultado(s) exibido(s) de {appointments.length} agendamento(s) cadastrados.
            </p>
          </div>
          <Button variant="outline">Exportar lista</Button>
        </CardContent>
      </Card>

      {portalReady && drawerMounted ? createPortal(drawer, document.body) : null}
    </div>
  );
}
