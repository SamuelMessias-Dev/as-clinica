import { getAgendaWorkspaceData } from "@/lib/data/agenda";
import { getCustomers } from "@/lib/data/customers";
import { CalendarDays, Clock3, Phone, Plus, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function todayDate() {
  const now = new Date();
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildAppointmentKey(date: string, time: string) {
  return `${date} ${time}`;
}

export default async function DashboardPage() {
  const [agendaData, customers] = await Promise.all([getAgendaWorkspaceData(), getCustomers()]);
  const today = todayDate();
  const todayAppointments = agendaData.appointments
    .filter((appointment) => appointment.date === today)
    .sort((left, right) => toMinutes(left.time) - toMinutes(right.time));
  const waitingConfirmation = todayAppointments.filter((appointment) => appointment.status === "aguardando").length;
  const nextAppointment = todayAppointments[0];
  const featuredCustomers = customers.slice(0, 3).map((customer) => {
    const relatedAppointments = agendaData.appointments
      .filter((appointment) => appointment.leadId === customer.id)
      .sort((left, right) => buildAppointmentKey(right.date, right.time).localeCompare(buildAppointmentKey(left.date, left.time)));
    const nextVisit = relatedAppointments[0];

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.cellphone,
      nextVisit: nextVisit ? `${nextVisit.date} · ${nextVisit.time}` : "Sem visita",
      description: customer.description || "Cliente cadastrado",
    };
  });
  const metrics = [
    {
      label: "Agendamentos de hoje",
      value: todayAppointments.length.toString(),
      detail: `${waitingConfirmation} aguardando confirmação`,
      icon: CalendarDays,
    },
    {
      label: "Clientes ativos",
      value: customers.length.toString(),
      detail: `${featuredCustomers.length} em destaque agora`,
      icon: Users,
    },
    {
      label: "Próximo horário",
      value: nextAppointment?.time ?? "--:--",
      detail: nextAppointment?.customer ?? "Sem horário agendado",
      icon: Clock3,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel da secretaria"
        description="Acompanhe os atendimentos do dia, confirme clientes e encontre rapidamente as informações mais usadas."
        actions={
          <>
            <Button className="flex-1 gap-2 sm:flex-none">
              <Plus className="h-4 w-4" />
              Novo agendamento
            </Button>
            <Button className="flex-1 gap-2 sm:flex-none" variant="outline">
              <Phone className="h-4 w-4" />
              Contatar cliente
            </Button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 p-4 sm:p-5">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
              <p className="text-2xl font-semibold sm:text-3xl">{value}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Agenda de hoje</h2>
            <Button variant="outline" size="sm">Ver todos</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {todayAppointments.length > 0 ? (
                <div className="divide-y">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="grid gap-4 p-4 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
                      <div className="rounded-md bg-muted px-3 py-2 text-center">
                        <p className="text-sm font-semibold">{appointment.time}</p>
                        <p className="text-[11px] text-muted-foreground">Hoje</p>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{appointment.customer}</p>
                          <StatusBadge status={appointment.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {appointment.service} com {appointment.professional}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{appointment.phone}</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
                        <UserCheck className="h-4 w-4" />
                        Confirmar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-sm text-muted-foreground">Nenhum agendamento registrado para hoje.</div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Clientes em destaque</h2>
            <span className="rounded-full border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {customers.length} clientes
            </span>
          </div>
          <Card>
            <CardHeader className="border-b p-4">
              <CardTitle className="text-base">Atendimentos recorrentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {featuredCustomers.map((customer) => (
                <div key={customer.id} className="rounded-lg border bg-background p-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{customer.phone}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">Próxima visita</span>
                    <p className="text-sm font-medium">{customer.nextVisit}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
