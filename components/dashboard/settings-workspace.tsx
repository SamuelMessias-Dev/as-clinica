"use client";

import { Building2, Clock3, MapPin, Phone, Save, Settings } from "lucide-react";
import { type FormEvent, useState } from "react";
import { saveClinicSettings } from "@/lib/actions/settings";
import type { ClinicSettingsData, WeekdaySetting } from "@/lib/data/clinic-settings";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const weekdayLabels = [
  { value: 0, short: "Dom", label: "Domingo" },
  { value: 1, short: "Seg", label: "Segunda" },
  { value: 2, short: "Ter", label: "Terça" },
  { value: 3, short: "Qua", label: "Quarta" },
  { value: 4, short: "Qui", label: "Quinta" },
  { value: 5, short: "Sex", label: "Sexta" },
  { value: 6, short: "Sáb", label: "Sábado" },
];

function formatDays(days: WeekdaySetting[]) {
  const labels = weekdayLabels
    .filter((day) => days.some((setting) => setting.weekday === day.value && setting.isOpen))
    .map((day) => day.short);

  return labels.length > 0 ? labels.join(", ") : "Nenhum dia selecionado";
}

function formatHours(day: WeekdaySetting) {
  if (!day.isOpen) return "Fechado";

  const pause = day.pauseStartsAt && day.pauseEndsAt ? ` · Pausa ${day.pauseStartsAt} - ${day.pauseEndsAt}` : "";
  return `${day.opensAt || "--:--"} - ${day.closesAt || "--:--"}${pause}`;
}

export function SettingsWorkspace({ initialSettings }: { initialSettings: ClinicSettingsData }) {
  const [settings, setSettings] = useState<ClinicSettingsData>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof Omit<ClinicSettingsData, "workingHours">>(key: K, value: ClinicSettingsData[K]) {
    setSaved(false);
    setError(null);
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateWorkingDay(weekday: number, updates: Partial<WeekdaySetting>) {
    setSaved(false);
    setError(null);
    setSettings((current) => ({
      ...current,
      workingHours: current.workingHours.map((day) => (
        day.weekday === weekday ? { ...day, ...updates } : day
      )),
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSaved(false);
    setError(null);

    const result = await saveClinicSettings(settings);

    if (result.success && result.data) {
      setSettings(result.data);
      setSaved(true);
    } else {
      setError(result.error ?? "Não foi possível salvar as configurações.");
    }

    setIsSubmitting(false);
  }

  const workingDaysLabel = formatDays(settings.workingHours);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Centralize os dados da clínica e os horários de funcionamento que alimentam a operação da recepção."
        actions={
          <Button type="submit" form="clinic-settings-form" className="gap-2" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        }
      />

      <form id="clinic-settings-form" onSubmit={handleSave} className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b p-4 sm:p-5">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" />
                Dados da clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="clinic-name">Nome da clínica</Label>
                  <Input id="clinic-name" value={settings.name} onChange={(event) => updateField("name", event.target.value)} className="h-11" />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="clinic-description">Descrição</Label>
                  <textarea
                    id="clinic-description"
                    value={settings.description}
                    onChange={(event) => updateField("description", event.target.value)}
                    className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2"
                    placeholder="Conte em poucas linhas o posicionamento da clínica."
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="clinic-address">Endereço</Label>
                  <Input id="clinic-address" value={settings.address} onChange={(event) => updateField("address", event.target.value)} className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic-phone">Telefone</Label>
                  <Input id="clinic-phone" value={settings.phone} onChange={(event) => updateField("phone", event.target.value)} className="h-11" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic-email">E-mail</Label>
                  <Input id="clinic-email" type="email" value={settings.email} onChange={(event) => updateField("email", event.target.value)} className="h-11" />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="clinic-website">Site ou link público</Label>
                  <Input id="clinic-website" value={settings.website} onChange={(event) => updateField("website", event.target.value)} className="h-11" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b p-4 sm:p-5">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3 className="h-4 w-4 text-primary" />
                Horário de funcionamento por dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-5">
              {weekdayLabels.map((weekday) => {
                const day = settings.workingHours.find((item) => item.weekday === weekday.value);
                if (!day) return null;

                return (
                  <div key={weekday.value} className={cn("rounded-lg border p-4 transition-colors", day.isOpen ? "bg-white" : "bg-muted/30")}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{weekday.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{formatHours(day)}</p>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={day.isOpen}
                          onChange={(event) => updateWorkingDay(day.weekday, { isOpen: event.target.checked })}
                        />
                        Aberto
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="space-y-2">
                        <Label htmlFor={`opens-at-${day.weekday}`}>Abertura</Label>
                        <Input
                          id={`opens-at-${day.weekday}`}
                          type="time"
                          value={day.opensAt}
                          onChange={(event) => updateWorkingDay(day.weekday, { opensAt: event.target.value })}
                          disabled={!day.isOpen}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`closes-at-${day.weekday}`}>Fechamento</Label>
                        <Input
                          id={`closes-at-${day.weekday}`}
                          type="time"
                          value={day.closesAt}
                          onChange={(event) => updateWorkingDay(day.weekday, { closesAt: event.target.value })}
                          disabled={!day.isOpen}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`pause-start-${day.weekday}`}>Início da pausa</Label>
                        <Input
                          id={`pause-start-${day.weekday}`}
                          type="time"
                          value={day.pauseStartsAt}
                          onChange={(event) => updateWorkingDay(day.weekday, { pauseStartsAt: event.target.value })}
                          disabled={!day.isOpen}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`pause-end-${day.weekday}`}>Fim da pausa</Label>
                        <Input
                          id={`pause-end-${day.weekday}`}
                          type="time"
                          value={day.pauseEndsAt}
                          onChange={(event) => updateWorkingDay(day.weekday, { pauseEndsAt: event.target.value })}
                          disabled={!day.isOpen}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {saved ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Configurações salvas no banco de dados.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <Card>
            <CardHeader className="border-b p-4">
              <CardTitle className="text-base">Resumo operacional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="rounded-md border bg-background p-3 text-sm">
                <p className="text-xs text-muted-foreground">Nome exibido</p>
                <p className="mt-1 font-medium">{settings.name}</p>
              </div>
              <div className="rounded-md border bg-background p-3 text-sm">
                <p className="text-xs text-muted-foreground">Dias abertos</p>
                <p className="mt-1 font-medium">{workingDaysLabel}</p>
              </div>
              <div className="rounded-md border bg-background p-3 text-sm">
                <p className="text-xs text-muted-foreground">Horários por dia</p>
                <div className="mt-2 space-y-2">
                  {weekdayLabels.map((weekday) => {
                    const day = settings.workingHours.find((item) => item.weekday === weekday.value);
                    if (!day) return null;

                    return (
                      <div key={weekday.value} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium">{weekday.short}</span>
                        <span className="text-right text-muted-foreground">{formatHours(day)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b p-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4 text-primary" />
                Onde isso aparece
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
              <p className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Os dados da clínica podem alimentar o site público e o topo do painel.
              </p>
              <p className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Os horários por dia servem como base para regras de agenda da clínica.
              </p>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
