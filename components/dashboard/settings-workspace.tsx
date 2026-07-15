"use client";

import { Building2, Clock3, MapPin, Save, Settings, Phone } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Clinic } from "@/lib/types/database";

type ClinicSettings = {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  scheduleStart: string;
  scheduleEnd: string;
  pauseStart: string;
  pauseEnd: string;
  activeDays: number[];
};

const weekdayLabels = [
  { value: 0, short: "Dom", label: "Domingo" },
  { value: 1, short: "Seg", label: "Segunda" },
  { value: 2, short: "Ter", label: "Terça" },
  { value: 3, short: "Qua", label: "Quarta" },
  { value: 4, short: "Qui", label: "Quinta" },
  { value: 5, short: "Sex", label: "Sexta" },
  { value: 6, short: "Sáb", label: "Sábado" },
];

function buildDefaultSettings(clinic: Clinic): ClinicSettings {
  return {
    name: clinic.name,
    description: clinic.description,
    address: clinic.address,
    phone: clinic.phone,
    email: "contato@asestetica.com.br",
    website: "https://www.asestetica.com.br/pg-asclinica",
    scheduleStart: "08:00",
    scheduleEnd: "19:00",
    pauseStart: "12:00",
    pauseEnd: "13:00",
    activeDays: [1, 2, 3, 4, 5, 6],
  };
}

function formatDays(days: number[]) {
  const labels = weekdayLabels.filter((day) => days.includes(day.value)).map((day) => day.short);
  return labels.length > 0 ? labels.join(", ") : "Nenhum dia selecionado";
}

export function SettingsWorkspace({ clinic }: { clinic: Clinic }) {
  const storageKey = useMemo(() => `clinic-settings:${clinic.slug}`, [clinic.slug]);
  const defaultSettings = useMemo(() => buildDefaultSettings(clinic), [clinic]);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<ClinicSettings>(defaultSettings);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<ClinicSettings>;
      setSettings((current) => ({
        ...current,
        ...parsed,
        activeDays: Array.isArray(parsed.activeDays) ? parsed.activeDays : current.activeDays,
      }));
    } catch {
      // Mantém os defaults se a configuração local estiver inválida.
    }
  }, [storageKey]);

  function updateField<K extends keyof ClinicSettings>(key: K, value: ClinicSettings[K]) {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function toggleDay(day: number) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      activeDays: current.activeDays.includes(day) ? current.activeDays.filter((item) => item !== day) : [...current.activeDays, day],
    }));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mounted) return;

    window.localStorage.setItem(storageKey, JSON.stringify(settings));
    setSaved(true);
  }

  const workingDaysLabel = formatDays(settings.activeDays);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Centralize os dados da clínica e o horário de funcionamento que alimentam a operação da recepção."
        actions={
          <Button type="submit" form="clinic-settings-form" className="gap-2">
            <Save className="h-4 w-4" />
            Salvar alterações
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
                Horário de funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-4 sm:p-5">
              <div className="space-y-2">
                <Label>Dias de atendimento</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {weekdayLabels.map((day) => {
                    const active = settings.activeDays.includes(day.value);

                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                          active ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted",
                        )}
                      >
                        <span className="block">{day.short}</span>
                        <span className="mt-1 block text-xs opacity-80">{day.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule-start">Abertura</Label>
                  <Input id="schedule-start" type="time" value={settings.scheduleStart} onChange={(event) => updateField("scheduleStart", event.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule-end">Fechamento</Label>
                  <Input id="schedule-end" type="time" value={settings.scheduleEnd} onChange={(event) => updateField("scheduleEnd", event.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pause-start">Início da pausa</Label>
                  <Input id="pause-start" type="time" value={settings.pauseStart} onChange={(event) => updateField("pauseStart", event.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pause-end">Fim da pausa</Label>
                  <Input id="pause-end" type="time" value={settings.pauseEnd} onChange={(event) => updateField("pauseEnd", event.target.value)} className="h-11" />
                </div>
              </div>
            </CardContent>
          </Card>

          {saved ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Alterações salvas localmente. Depois a gente conecta isso ao banco.
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
                <p className="text-xs text-muted-foreground">Atendimento</p>
                <p className="mt-1 font-medium">
                  {settings.scheduleStart} - {settings.scheduleEnd}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Pausa {settings.pauseStart} - {settings.pauseEnd}</p>
              </div>
              <div className="rounded-md border bg-background p-3 text-sm">
                <p className="text-xs text-muted-foreground">Dias ativos</p>
                <p className="mt-1 font-medium">{workingDaysLabel}</p>
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
                Os dados da clínica aparecem no site público e no topo do painel.
              </p>
              <p className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                O telefone alimenta a referência rápida da recepção e dos contatos.
              </p>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
