"use client";

import { ImagePlus, Mail, Pencil, Phone, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { createProfessional, updateProfessional } from "@/lib/actions/professionals";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ProfessionalProfile } from "@/lib/data/professionals";

type ProfessionalPhoto = {
  file: File;
  previewUrl: string;
};

const PROFESSIONAL_PHOTOS_BUCKET = "profissionais";

type DrawerMode = "create" | "edit";

type DrawerState = {
  open: boolean;
  mode: DrawerMode;
  professionalId?: number;
};

type ProfessionalFormState = {
  name: string;
  cellphone: string;
  email: string;
  description: string;
  photoUrl: string | null;
  photoFile: ProfessionalPhoto | null;
  scheduleStart: string;
  scheduleEnd: string;
  pauseStart: string;
  pauseEnd: string;
  activeDays: number[];
};

const weekdayLabels = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatBrazilianCellphone(value: string) {
  const digits = onlyDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const areaCode = digits.slice(0, 2);
  const subscriber = digits.slice(2);
  const firstGroupSize = digits.length > 10 ? 5 : 4;
  const firstGroup = subscriber.slice(0, firstGroupSize);
  const secondGroup = subscriber.slice(firstGroupSize, firstGroupSize + 4);

  if (!secondGroup) {
    return `(${areaCode}) ${firstGroup}`;
  }

  return `(${areaCode}) ${firstGroup}-${secondGroup}`;
}

function createBlankForm(): ProfessionalFormState {
  return {
    name: "",
    cellphone: "",
    email: "",
    description: "",
    photoUrl: null,
    photoFile: null,
    scheduleStart: "08:00",
    scheduleEnd: "18:00",
    pauseStart: "12:00",
    pauseEnd: "13:00",
    activeDays: [1, 2, 3, 4, 5],
  };
}

function mapToForm(professional?: ProfessionalProfile): ProfessionalFormState {
  if (!professional) {
    return createBlankForm();
  }

  return {
    name: professional.name,
    cellphone: onlyDigits(professional.cellphone),
    email: professional.email,
    description: professional.description,
    photoUrl: professional.photoUrl,
    photoFile: null,
    scheduleStart: professional.scheduleStart,
    scheduleEnd: professional.scheduleEnd,
    pauseStart: professional.pauseStart,
    pauseEnd: professional.pauseEnd,
    activeDays: professional.activeDays,
  };
}

function ProfessionalDrawer({
  open,
  mode,
  professional,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: DrawerMode;
  professional?: ProfessionalProfile;
  onClose: () => void;
  onSave: (values: ProfessionalFormState) => Promise<void>;
}) {
  const [portalReady, setPortalReady] = useState(false);
  const [form, setForm] = useState<ProfessionalFormState>(createBlankForm());
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm(mapToForm(professional));
    setFileInputKey((current) => current + 1);
  }, [open, professional, mode]);

  useEffect(() => {
    return () => {
      if (form.photoFile?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(form.photoFile.previewUrl);
      }
    };
  }, [form.photoFile?.previewUrl]);

  function addPhotoFile(file: File | null) {
    if (!file) return;

    setForm((current) => {
      if (current.photoFile?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(current.photoFile.previewUrl);
      }

      return {
        ...current,
        photoUrl: current.photoUrl,
        photoFile: {
          file,
          previewUrl: URL.createObjectURL(file),
        },
      };
    });

    setFileInputKey((current) => current + 1);
  }

  function removePhoto() {
    setForm((current) => ({
      ...current,
      photoFile: null,
      photoUrl: null,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        cellphone: onlyDigits(form.cellphone),
        email: form.email.trim().toLowerCase(),
        description: form.description.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const drawer = (
    <div className={cn("fixed inset-0 z-[100] h-dvh", open ? "pointer-events-auto" : "pointer-events-none")}>
      <button
        type="button"
        aria-label="Fechar formulário"
        onClick={onClose}
        className={cn("absolute inset-0 bg-black/25 transition-opacity duration-300 lg:bg-black/20", open ? "opacity-100" : "opacity-0")}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 flex h-dvh max-h-dvh w-[min(92vw,640px)] transform border-l bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <form onSubmit={submit} className="flex h-full w-full flex-col">
          <div className="border-b p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <UserRound className="h-4 w-4" />
                  {mode === "create" ? "Novo profissional" : "Editar profissional"}
                </p>
                <h2 className="text-xl font-semibold leading-tight sm:text-2xl">
                  {mode === "create" ? "Cadastro do profissional" : professional?.name}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {mode === "create"
                    ? "Preencha os dados principais e adicione fotos para deixar o cadastro mais claro para a secretária."
                    : "Ajuste os dados de contato, descrição e fotos do profissional."}
                </p>
              </div>
              <Button aria-label="Fechar formulário" variant="ghost" size="sm" className="h-9 w-9 px-0" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="space-y-5">
              <section className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-semibold">Dados principais</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Essas informações são as que a equipe consulta primeiro.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="professional-name">Nome</Label>
                    <Input id="professional-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Dra. Larissa" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professional-cellphone">Celular</Label>
                    <Input
                      id="professional-cellphone"
                      value={formatBrazilianCellphone(form.cellphone)}
                      onChange={(event) => setForm((current) => ({ ...current, cellphone: onlyDigits(event.target.value) }))}
                      placeholder="(85) 99999-9999"
                      inputMode="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professional-email">E-mail</Label>
                    <Input
                      id="professional-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="nome@clinica.com"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="professional-description">Descrição</Label>
                    <textarea
                      id="professional-description"
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Função, especialidade ou observações importantes."
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-semibold">Horário de atendimento</h3>
                  <p className="mt-1 text-sm text-muted-foreground">A agenda usa essa base para sugerir horários livres e bloquear pausas.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Dias ativos</Label>
                    <div className="flex flex-wrap gap-2">
                      {weekdayLabels.map(({ value, label }) => {
                        const checked = form.activeDays.includes(value);
                        return (
                          <label
                            key={value}
                            className={cn(
                              "inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                              checked ? "border-primary bg-primary/10 text-primary" : "bg-white hover:bg-muted",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setForm((current) => ({
                                  ...current,
                                  activeDays: checked
                                    ? current.activeDays.filter((day) => day !== value)
                                    : [...current.activeDays, value].sort((a, b) => a - b),
                                }))
                              }
                              className="h-4 w-4 accent-primary"
                            />
                            {label}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="professional-schedule-start">Início</Label>
                      <Input
                        id="professional-schedule-start"
                        type="time"
                        value={form.scheduleStart}
                        onChange={(event) => setForm((current) => ({ ...current, scheduleStart: event.target.value }))}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="professional-schedule-end">Fim</Label>
                      <Input
                        id="professional-schedule-end"
                        type="time"
                        value={form.scheduleEnd}
                        onChange={(event) => setForm((current) => ({ ...current, scheduleEnd: event.target.value }))}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="professional-pause-start">Pausa início</Label>
                      <Input
                        id="professional-pause-start"
                        type="time"
                        value={form.pauseStart}
                        onChange={(event) => setForm((current) => ({ ...current, pauseStart: event.target.value }))}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="professional-pause-end">Pausa fim</Label>
                      <Input
                        id="professional-pause-end"
                        type="time"
                        value={form.pauseEnd}
                        onChange={(event) => setForm((current) => ({ ...current, pauseEnd: event.target.value }))}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">Fotos</h3>
                    <p className="mt-1 text-sm text-muted-foreground">A imagem ajuda a secretaria a reconhecer rapidamente o profissional. Nesta fase, fica como prévia local até salvar.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium hover:bg-muted">
                    <ImagePlus className="h-4 w-4" />
                    {form.photoUrl || form.photoFile ? "Trocar foto" : "Adicionar foto"}
                    <input
                      key={fileInputKey}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => addPhotoFile(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                {form.photoUrl || form.photoFile ? (
                  <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
                    <div className="relative aspect-[4/3] bg-muted">
                      <Image
                        src={form.photoFile?.previewUrl ?? form.photoUrl ?? ""}
                        alt={form.name || "Foto do profissional"}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3">
                      <p className="truncate text-sm font-medium">{form.photoFile?.file.name ?? "Foto cadastrada"}</p>
                      <Button type="button" variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={removePhoto} aria-label="Remover foto">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-white p-4 text-sm text-muted-foreground">
                    Nenhuma foto adicionada ainda. Você pode enviar uma imagem para compor o cadastro.
                  </div>
                )}
              </section>
            </div>
          </div>

          <div className="border-t bg-white p-4 sm:p-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2" disabled={isSubmitting}>
                <Plus className="h-4 w-4" />
                {isSubmitting ? "Salvando..." : mode === "create" ? "Criar profissional" : "Salvar profissional"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return portalReady ? createPortal(drawer, document.body) : null;
}

export function ProfessionalsWorkspace({ professionals }: { professionals: ProfessionalProfile[] }) {
  const [catalog, setCatalog] = useState(professionals);
  const [search, setSearch] = useState("");
  const [drawerState, setDrawerState] = useState<DrawerState>({ open: false, mode: "create" });
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(professionals[0]?.id ?? null);

  useEffect(() => {
    if (drawerState.open) {
      setDrawerMounted(true);
      return;
    }

    const timer = window.setTimeout(() => setDrawerMounted(false), 300);
    return () => window.clearTimeout(timer);
  }, [drawerState.open]);

  const filteredProfessionals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog;

    return catalog.filter((professional) => {
      const haystack = `${professional.name} ${professional.cellphone} ${formatBrazilianCellphone(professional.cellphone)} ${professional.email} ${professional.description}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [catalog, search]);

  const selectedProfessional = selectedId !== null ? catalog.find((professional) => professional.id === selectedId) ?? null : null;

  function openCreateDrawer() {
    setDrawerState({ open: true, mode: "create" });
    setSelectedId(null);
  }

  function openEditDrawer(professional: ProfessionalProfile) {
    setSelectedId(professional.id);
    setDrawerState({ open: true, mode: "edit", professionalId: professional.id });
  }

  async function saveProfessional(values: ProfessionalFormState) {
    let photoUrl = values.photoUrl;

    if (values.photoFile) {
      const supabase = createClient();
      const file = values.photoFile.file;
      const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
      const filePath = `${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage.from(PROFESSIONAL_PHOTOS_BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (uploadError) {
        alert(`Não foi possível enviar a foto: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage.from(PROFESSIONAL_PHOTOS_BUCKET).getPublicUrl(filePath);
      photoUrl = data.publicUrl;
    }

    const payload = {
      name: values.name,
      cellphone: values.cellphone,
      email: values.email,
      description: values.description,
      photoUrl,
      scheduleStart: values.scheduleStart,
      scheduleEnd: values.scheduleEnd,
      pauseStart: values.pauseStart,
      pauseEnd: values.pauseEnd,
      activeDays: values.activeDays,
    };

    if (drawerState.mode === "edit" && drawerState.professionalId) {
      const result = await updateProfessional(drawerState.professionalId, payload);

      if (!result.success || !result.data) {
        alert(result.error ?? "Não foi possível atualizar o profissional.");
        return;
      }

      const updatedProfessional: ProfessionalProfile = {
        id: result.data.id,
        name: result.data.nome ?? payload.name,
        cellphone: result.data.celular ?? payload.cellphone,
        email: result.data.email ?? payload.email,
        description: result.data.descricao ?? payload.description,
        photoUrl: result.data.foto_url ?? payload.photoUrl,
        scheduleStart: result.data.agenda_inicio ?? payload.scheduleStart,
        scheduleEnd: result.data.agenda_fim ?? payload.scheduleEnd,
        pauseStart: result.data.agenda_pausa_inicio ?? payload.pauseStart,
        pauseEnd: result.data.agenda_pausa_fim ?? payload.pauseEnd,
        activeDays: result.data.agenda_dias_semana ?? payload.activeDays,
      };

      setCatalog((current) => current.map((professional) => (
        professional.id === drawerState.professionalId ? updatedProfessional : professional
      )));
      setSelectedId(drawerState.professionalId);
    } else {
      const result = await createProfessional(payload);

      if (!result.success || !result.data) {
        alert(result.error ?? "Não foi possível criar o profissional.");
        return;
      }

      const newProfessional: ProfessionalProfile = {
        id: result.data.id,
        name: result.data.nome ?? payload.name,
        cellphone: result.data.celular ?? payload.cellphone,
        email: result.data.email ?? payload.email,
        description: result.data.descricao ?? payload.description,
        photoUrl: result.data.foto_url ?? payload.photoUrl,
        scheduleStart: result.data.agenda_inicio ?? payload.scheduleStart,
        scheduleEnd: result.data.agenda_fim ?? payload.scheduleEnd,
        pauseStart: result.data.agenda_pausa_inicio ?? payload.pauseStart,
        pauseEnd: result.data.agenda_pausa_fim ?? payload.pauseEnd,
        activeDays: result.data.agenda_dias_semana ?? payload.activeDays,
      };

      setCatalog((current) => [newProfessional, ...current]);
      setSelectedId(newProfessional.id);
    }

    setDrawerState({ open: false, mode: "create" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profissionais"
        description="Cadastre nomes, contatos, descrição e fotos para deixar a operação da clínica mais rápida na recepção."
        actions={
          <Button className="w-full gap-2 sm:w-auto" onClick={openCreateDrawer}>
            <Plus className="h-4 w-4" />
            Novo profissional
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 pl-9" placeholder="Buscar profissional, celular ou e-mail" />
      </div>

      {filteredProfessionals.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredProfessionals.map((professional) => (
            <button
              key={professional.id}
              type="button"
              onClick={() => openEditDrawer(professional)}
              className={cn(
                "w-full rounded-lg border bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-sm",
                selectedProfessional?.id === professional.id && "border-primary shadow-sm",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-sm font-semibold text-primary">
                  {professional.photoUrl ? (
                    <div className="relative h-full w-full">
                      <Image src={professional.photoUrl} alt={professional.name} fill unoptimized className="object-cover" />
                    </div>
                  ) : (
                    initials(professional.name) || <UserRound className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{professional.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{professional.description || "Sem descrição cadastrada."}</p>
                    </div>
                    <Pencil className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-md border p-2">
                  <p className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Celular
                  </p>
                  <p className="mt-1 text-sm font-semibold">{formatBrazilianCellphone(professional.cellphone) || "Não informado"}</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    E-mail
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold">{professional.email || "Não informado"}</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-[11px] uppercase text-muted-foreground">Fotos</p>
                  <p className="mt-1 text-sm font-semibold">{professional.photoUrl ? "1" : "0"}</p>
                </div>
              </div>
            </button>
          ))}
        </section>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="font-medium">Nenhum profissional encontrado.</p>
            <p className="mt-1 text-sm text-muted-foreground">Tente outra busca ou abra o cadastro para adicionar o primeiro.</p>
            <Button className="mt-4 gap-2" onClick={openCreateDrawer}>
              <Plus className="h-4 w-4" />
              Novo profissional
            </Button>
          </CardContent>
        </Card>
      )}

      {drawerMounted ? (
        <ProfessionalDrawer
          open={drawerState.open}
          mode={drawerState.mode}
          professional={drawerState.mode === "edit" ? catalog.find((item) => item.id === drawerState.professionalId) : undefined}
          onClose={() => setDrawerState({ open: false, mode: "create" })}
          onSave={saveProfessional}
        />
      ) : null}
    </div>
  );
}
