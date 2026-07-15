"use client";

import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Columns3, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { AppointmentModal } from "@/components/dashboard/appointment-modal";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomerProfile } from "@/lib/data/customers";
import type { ProfessionalProfile } from "@/lib/data/professionals";
import type { ProcedureCatalogItem } from "@/lib/data/procedures";
import { cn } from "@/lib/utils";
import type { AgendaAppointment } from "@/lib/data/agenda";
import type { DashboardProfessional } from "@/lib/mocks/dashboard";

type ViewMode = "day" | "week" | "month";

const timeSlots = ["08:00", "09:00", "10:30", "11:30", "14:00", "15:30", "16:00", "17:30"];

const viewOptions: Array<{ value: ViewMode; label: string; icon: typeof CalendarDays }> = [
  { value: "day", label: "Dia", icon: CalendarDays },
  { value: "week", label: "Semana", icon: Columns3 },
  { value: "month", label: "Mês", icon: CalendarRange },
];

type AgendaWorkspaceProps = {
  appointments?: AgendaAppointment[];
  professionals?: DashboardProfessional[];
  customers?: CustomerProfile[];
  professionalOptions?: ProfessionalProfile[];
  procedures?: ProcedureCatalogItem[];
};

function buildWeekDays(baseDate: string) {
  const initial = new Date(`${baseDate}T00:00:00`);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(initial);
    date.setDate(initial.getDate() + index);

    const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });

    return {
      date: date.toISOString().slice(0, 10),
      label: index === 0 ? "Hoje" : date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" }),
      short: weekday.replace(".", ""),
      day: String(date.getDate()).padStart(2, "0"),
    };
  });
}

function buildMonthDays(baseDate: string) {
  const [year, month] = baseDate.split("-");
  const totalDays = new Date(Number(year), Number(month), 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const date = `${year}-${month}-${String(dayNumber).padStart(2, "0")}`;
    return { date, day: dayNumber };
  });
}

function shiftDate(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function AgendaWorkspace({
  appointments = [],
  professionals = [],
  customers = [],
  professionalOptions = [],
  procedures = [],
}: AgendaWorkspaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(appointments[0]?.date ?? new Date().toISOString().slice(0, 10));
  const [weekStartDate, setWeekStartDate] = useState(appointments[0]?.date ?? new Date().toISOString().slice(0, 10));
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("all");
  const [drawerState, setDrawerState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    date?: string;
    time?: string;
    appointment?: AgendaAppointment;
  }>({ open: false, mode: "create" });

  const visibleAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        if (selectedProfessionalId === "all") return true;
        return String(appointment.professionalId ?? "") === selectedProfessionalId;
      }),
    [appointments, selectedProfessionalId],
  );

  const selectedAppointments = useMemo(
    () => visibleAppointments.filter((appointment) => appointment.date === selectedDate),
    [selectedDate, visibleAppointments],
  );

  const weekDays = useMemo(() => buildWeekDays(weekStartDate), [weekStartDate]);
  const monthDays = useMemo(() => buildMonthDays(`${selectedDate.slice(0, 7)}-01`), [selectedDate]);

  const selectedProfessional = useMemo(
    () => professionalOptions.find((professional) => String(professional.id) === selectedProfessionalId),
    [professionalOptions, selectedProfessionalId],
  );

  function openCreateDrawer(date = selectedDate, time?: string) {
    setSelectedDate(date);
    setDrawerState({ open: true, mode: "create", date, time });
  }

  function openEditDrawer(appointment: AgendaAppointment) {
    setSelectedDate(appointment.date);
    setDrawerState({
      open: true,
      mode: "edit",
      date: appointment.date,
      time: appointment.time,
      appointment,
    });
  }

  function goToPreviousDay() {
    setWeekStartDate((current) => shiftDate(current, -7));
    setSelectedDate((current) => shiftDate(current, -7));
  }

  function goToNextDay() {
    setWeekStartDate((current) => shiftDate(current, 7));
    setSelectedDate((current) => shiftDate(current, 7));
  }

  const selectedDateLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${selectedDate}T00:00:00`));

  const selectedMonthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${selectedDate}T00:00:00`));

  const initialProfessionalId = selectedProfessionalId === "all" ? undefined : selectedProfessionalId;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Controle datas disponíveis, encaixes e agendamentos criados pela secretária."
        actions={
          <Button className="w-full gap-2 sm:w-auto" onClick={() => openCreateDrawer()}>
            <Plus className="h-4 w-4" />
            Novo agendamento
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-3 rounded-lg border bg-white p-1">
          {viewOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setViewMode(value)}
              className={cn(
                "flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground",
                viewMode === value && "bg-primary text-primary-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
            <SelectTrigger className="h-11 w-[220px]">
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

          <Button variant="outline" size="sm" className="h-11 w-11 px-0" onClick={goToPreviousDay} aria-label="Dia anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {weekDays.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  "min-w-20 rounded-lg border bg-white px-3 py-2 text-left text-sm transition-colors",
                  selectedDate === day.date && "border-primary bg-primary text-primary-foreground",
                )}
              >
                <span className="block text-xs opacity-80">{day.short}</span>
                <span className="block text-lg font-semibold">{day.day}</span>
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" className="h-11 w-11 px-0" onClick={goToNextDay} aria-label="Próximo dia">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "day" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Visão diária</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{selectedDateLabel}</p>
              {selectedProfessional ? <p className="mt-1 text-xs text-muted-foreground">Filtrado por {selectedProfessional.name}</p> : null}
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {selectedAppointments.length === 0 ? (
                <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                  Nenhum agendamento nesse dia para este filtro. Os horários livres continuam disponíveis para criação.
                </div>
              ) : null}

              {timeSlots.map((time) => {
                const appointment = selectedAppointments.find((item) => item.time === time);

                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => (appointment ? openEditDrawer(appointment) : openCreateDrawer(selectedDate, time))}
                    className={cn(
                      "grid w-full gap-3 rounded-md border p-3 text-left transition-colors sm:grid-cols-[72px_1fr_auto] sm:items-center",
                      appointment ? "bg-white hover:bg-muted/60" : "border-dashed bg-muted/30 hover:bg-muted",
                    )}
                  >
                    <span className="font-semibold">{time}</span>
                    {appointment ? (
                      <>
                        <span className="min-w-0">
                          <span className="block font-medium">{appointment.customer}</span>
                          <span className="block text-sm text-muted-foreground">
                            {appointment.service} com {appointment.professional}
                          </span>
                        </span>
                        <StatusBadge status={appointment.status} />
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground sm:col-span-2">Horário livre para novo agendamento</span>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-base">Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {professionals.length > 0 ? (
                professionals.map((professional) => (
                  <div key={professional.id} className="rounded-md border p-3">
                    <p className="font-medium">{professional.name}</p>
                    <p className="text-sm text-muted-foreground">{professional.role}</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span>Livre</span>
                      <strong>{professional.nextAvailable}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                  Nenhum profissional cadastrado ainda.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {viewMode === "week" ? (
        <div className="grid gap-3 lg:grid-cols-7">
          {weekDays.map((day) => {
            const appointmentsOfDay = visibleAppointments.filter((appointment) => appointment.date === day.date);

            return (
              <Card key={day.date} className={cn(selectedDate === day.date && "border-primary")}>
                <CardHeader className="p-4">
                  <button type="button" onClick={() => setSelectedDate(day.date)} className="text-left">
                    <CardTitle className="text-base">
                      {day.short}, {day.day}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">{day.label}</p>
                  </button>
                </CardHeader>
                <CardContent className="space-y-2 p-4 pt-0">
                  {appointmentsOfDay.length > 0 ? (
                    appointmentsOfDay.map((appointment) => (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => openEditDrawer(appointment)}
                        className="w-full rounded-md border p-2 text-left text-sm hover:bg-muted"
                      >
                        <strong>{appointment.time}</strong>
                        <span className="mt-1 block truncate text-muted-foreground">{appointment.customer}</span>
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCreateDrawer(day.date)}
                      className="w-full rounded-md border border-dashed p-3 text-left text-sm text-muted-foreground hover:bg-muted"
                    >
                      Livre
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {viewMode === "month" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold capitalize">{selectedMonthLabel}</h3>
              <p className="text-sm text-muted-foreground">Visão mensal dos agendamentos.</p>
            </div>
            <span className="rounded-full border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {selectedDateLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {monthDays.map(({ date, day: dayNumber }) => {
              const appointmentsOfDay = visibleAppointments.filter((appointment) => appointment.date === date);

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={cn("min-h-28 rounded-lg border bg-white p-3 text-left hover:bg-muted", selectedDate === date && "border-primary")}
                >
                  <span className="text-lg font-semibold">{dayNumber}</span>
                  <span className="mt-3 block text-sm text-muted-foreground">
                    {appointmentsOfDay.length > 0 ? `${appointmentsOfDay.length} agendamento(s)` : "Livre"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <AppointmentModal
        open={drawerState.open}
        mode={drawerState.mode}
        appointment={drawerState.appointment}
        onClose={() => setDrawerState({ open: false, mode: "create" })}
        initialDate={drawerState.date}
        initialTime={drawerState.time}
        initialProfessionalId={initialProfessionalId}
        customers={customers}
        professionals={professionalOptions}
        procedures={procedures}
        appointments={visibleAppointments}
      />
    </div>
  );
}
