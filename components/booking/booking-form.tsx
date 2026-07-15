"use client";

import { Check, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/types/database";

const timeOptions = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

const steps = [
  { id: 1, label: "Procedimento" },
  { id: 2, label: "Data" },
  { id: 3, label: "Dados" },
];

function formatPrice(priceInCents: number) {
  if (!priceInCents) return "Sob consulta";
  return (priceInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatPhone(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getAvailableDays() {
  const formatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    const weekday = formatter.format(date).replace(".", "").toUpperCase();

    return {
      value: toYmd(date),
      weekday,
      day: date.getDate(),
      label: date.toLocaleDateString("pt-BR"),
    };
  });
}

function formatSelectedDate(value: string) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export function BookingForm({ clinicId, clinicSlug, services }: { clinicId: string; clinicSlug: string; services: Service[] }) {
  const router = useRouter();
  const availableDays = useMemo(() => getAvailableDays(), []);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(availableDays[2]?.value ?? "");
  const [time, setTime] = useState("11:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
  );

  const canGoNext = currentStep === 1 ? Boolean(selectedService) : currentStep === 2 ? Boolean(date && time) : true;
  const canSubmit = Boolean(selectedService && date && time && name.trim() && onlyDigits(phone).length >= 10);

  function goNext() {
    if (!canGoNext) return;
    setCurrentStep((step) => Math.min(step + 1, 3));
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentStep < 3) {
      goNext();
      return;
    }

    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    router.push(`/clinica/${clinicSlug}/agendar/confirmacao`);
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-[#e3dbcf] bg-white shadow-[0_16px_44px_rgba(33,28,24,0.08)]">
      <input type="hidden" name="clinic_id" value={clinicId} />

      <div className="border-b border-[#eee8df] px-6 py-6 sm:px-10">
        <div className="mx-auto grid max-w-lg grid-cols-[1fr_1fr_1fr] items-start">
          {steps.map((step, index) => {
            const active = currentStep === step.id;
            const done = currentStep > step.id;

            return (
              <div key={step.id} className="relative text-center">
                {index > 0 ? (
                  <span
                    className={cn(
                      "absolute right-1/2 top-5 h-px w-full -translate-x-5",
                      done || active ? "bg-[#d7ad2d]" : "bg-[#e3dbcf]",
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border bg-white text-sm transition",
                    active && "border-[#d7ad2d] bg-[#d7ad2d] text-white",
                    done && "border-[#d7ad2d] bg-[#d7ad2d] text-white",
                    !active && !done && "border-[#e3dbcf] text-[#9f948a]",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : step.id}
                </span>
                <p className={cn("mt-2 text-xs", active || done ? "text-[#211c18]" : "text-[#9f948a]")}>{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="min-h-[430px] px-6 py-7 sm:px-10">
        {currentStep === 1 ? (
          <section className="landing-reveal">
            <h2 className="text-base font-medium text-[#211c18]">Escolha o procedimento de interesse</h2>
            <div className="mt-5 grid gap-3">
              {services.map((service) => {
                const selected = service.id === selectedServiceId;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedServiceId(service.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-5 rounded-xl border bg-white px-4 py-4 text-left transition duration-200",
                      selected
                        ? "border-[#d7ad2d] shadow-[0_10px_24px_rgba(215,173,45,0.13)]"
                        : "border-[#e3dbcf] hover:border-[#d7ad2d]/70",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-medium text-[#211c18]">{service.name}</span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-[#746b62]">
                        <Clock3 className="h-3.5 w-3.5" />
                        {service.duration_label ?? `${service.duration_minutes} min`}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-sm font-medium text-[#d7ad2d]">
                      {formatPrice(service.price_in_cents)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {currentStep === 2 ? (
          <section className="landing-reveal space-y-8">
            <div>
              <h2 className="flex items-center gap-2 text-base font-medium text-[#211c18]">Dias disponíveis</h2>
              <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {availableDays.map((day) => {
                  const selected = date === day.value;
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => setDate(day.value)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-center transition duration-200",
                        selected
                          ? "border-[#d7ad2d] bg-[#d7ad2d] text-white shadow-[0_12px_26px_rgba(215,173,45,0.20)]"
                          : "border-[#e3dbcf] bg-white text-[#60564d] hover:border-[#d7ad2d]/70",
                      )}
                    >
                      <span className={cn("block text-xs uppercase", selected ? "text-white/80" : "text-[#9f948a]")}>{day.weekday}</span>
                      <span className="mt-1 block text-lg font-medium">{day.day}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#eee8df] pt-6">
              <h2 className="text-base font-medium text-[#211c18]">Horários livres</h2>
              <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {timeOptions.map((option) => {
                  const selected = time === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTime(option)}
                      className={cn(
                        "rounded-md border px-4 py-2.5 text-sm transition duration-200",
                        selected
                          ? "border-[#d7ad2d] bg-[#fffaf3] text-[#d7ad2d]"
                          : "border-[#e3dbcf] bg-white text-[#60564d] hover:border-[#d7ad2d]/70",
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {currentStep === 3 ? (
          <section className="landing-reveal">
            <h2 className="text-base font-medium text-[#211c18]">Quase lá! Precisamos de alguns dados.</h2>

            <div className="mt-4 grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Seu nome"
                  className="h-12 rounded-xl border-[#e3dbcf] bg-white text-base"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="(00) 00000-0000"
                  className="h-12 rounded-xl border-[#e3dbcf] bg-white text-base"
                  inputMode="tel"
                  autoComplete="tel"
                  value={formatPhone(phone)}
                  onChange={(event) => setPhone(onlyDigits(event.target.value))}
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#eee8df] bg-[#faf8f5] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8c8177]">Resumo do agendamento</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#746b62]">Procedimento</span>
                  <span className="text-right font-medium text-[#211c18]">{selectedService?.name ?? "Selecione um procedimento"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#746b62]">Data e Hora</span>
                  <span className="text-right font-medium text-[#211c18]">
                    {date ? formatSelectedDate(date) : "--"} {time ? `às ${time}` : ""}
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-[#eee8df] px-6 py-5 sm:px-10">
        <Button
          type="button"
          variant="ghost"
          disabled={currentStep === 1}
          onClick={goBack}
          className="gap-2 text-[#60564d] disabled:text-[#c9c1b7]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>

        {currentStep < 3 ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            className="rounded-full bg-[#d7ad2d] px-7 text-white shadow-[0_12px_26px_rgba(215,173,45,0.20)] hover:bg-[#c79b24]"
          >
            Continuar
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="rounded-full bg-[#d7ad2d] px-7 text-white shadow-[0_12px_26px_rgba(215,173,45,0.20)] hover:bg-[#c79b24] disabled:bg-[#eeeae4] disabled:text-[#aaa197] disabled:shadow-none"
          >
            {isSubmitting ? "Enviando..." : "Confirmar Agendamento"}
          </Button>
        )}
      </div>
    </form>
  );
}
