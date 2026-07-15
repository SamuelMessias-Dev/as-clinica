"use client";

import { CheckCircle2, ChevronRight, Clock, DollarSign, ListTree, Pencil, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ProcedureCatalogItem } from "@/lib/data/procedures";
import { updateProcedureVariation, createProcedure, deactivateProcedure, deleteVariation } from "@/lib/actions/procedures";

type ProcedureVariation = ProcedureCatalogItem["variations"][number];

function formatMoney(value: number | null) {
  if (value === null) return "Sem valor";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseMoneyInput(value: string) {
  const cleanValue = value.trim().replace(/[^\d,.-]/g, "");

  if (!cleanValue) return null;

  const lastCommaIndex = cleanValue.lastIndexOf(",");
  const lastDotIndex = cleanValue.lastIndexOf(".");
  const decimalIndex = Math.max(lastCommaIndex, lastDotIndex);

  if (decimalIndex >= 0) {
    const integerPart = cleanValue.slice(0, decimalIndex).replace(/[^\d-]/g, "");
    const decimalPart = cleanValue.slice(decimalIndex + 1).replace(/\D/g, "");
    const parsed = Number(`${integerPart || "0"}.${decimalPart || "0"}`);

    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number(cleanValue.replace(/[^\d-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function getPriceRange(procedure: Pick<ProcedureCatalogItem, "basePrice" | "variations">) {
  const prices = procedure.variations.map((variation) => variation.price).filter((price): price is number => price !== null);

  if (!prices.length) return formatMoney(procedure.basePrice);

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) return formatMoney(min);
  return `${formatMoney(min)} a ${formatMoney(max)}`;
}

function getDurationSummary(procedure: Pick<ProcedureCatalogItem, "baseDuration" | "variations">) {
  const durations = procedure.variations.map((variation) => variation.duration).filter(Boolean);

  if (durations.length > 1) return `${durations[0]} a ${durations[durations.length - 1]}`;
  if (durations.length === 1) return durations[0];
  return procedure.baseDuration ?? "Sem duração";
}

function ProcedureDetails({
  procedure,
  onClose,
  isDrawer = false,
  onAddVariation,
  onUpdateProcedure,
  onUpdateVariation,
  onDeleteProcedure,
  onDeleteVariation,
}: {
  procedure: ProcedureCatalogItem;
  onClose?: () => void;
  isDrawer?: boolean;
  onAddVariation: (procedureId: number, variation: Omit<ProcedureVariation, "id">) => void;
  onUpdateProcedure: (procedureId: number, updates: Pick<ProcedureCatalogItem, "name" | "description" | "baseDuration" | "basePrice">) => void;
  onUpdateVariation: (procedureId: number, variationId: number, updates: Omit<ProcedureVariation, "id">) => void;
  onDeleteProcedure: (procedureId: number) => void;
  onDeleteVariation: (procedureId: number, variationId: number) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVariationId, setEditingVariationId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [examples, setExamples] = useState("");
  const [variationName, setVariationName] = useState("");
  const [variationDuration, setVariationDuration] = useState("");
  const [variationPrice, setVariationPrice] = useState("");
  const [variationExamples, setVariationExamples] = useState("");
  const [editName, setEditName] = useState(procedure.name);
  const [editDescription, setEditDescription] = useState(procedure.description ?? "");
  const [editDuration, setEditDuration] = useState(procedure.baseDuration ?? "");
  const [editPrice, setEditPrice] = useState(procedure.basePrice === null ? "" : String(procedure.basePrice).replace(".", ","));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteProcedure, setConfirmDeleteProcedure] = useState(false);
  const [confirmDeleteVariationId, setConfirmDeleteVariationId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function submitVariation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) return;

    const parsedPrice = parseMoneyInput(price);

    onAddVariation(procedure.id, {
      name: name.trim(),
      duration: duration.trim() || null,
      price: parsedPrice,
      examples: examples.trim() || null,
    });

    setName("");
    setDuration("");
    setPrice("");
    setExamples("");
    setFormOpen(false);
  }

  function submitProcedure(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editName.trim()) return;

    const parsedPrice = parseMoneyInput(editPrice);

    onUpdateProcedure(procedure.id, {
      name: editName.trim(),
      description: editDescription.trim() || null,
      baseDuration: editDuration.trim() || null,
      basePrice: parsedPrice,
    });

    setEditOpen(false);
  }

  function startVariationEdit(variation: ProcedureVariation) {
    setEditingVariationId(variation.id);
    setVariationName(variation.name);
    setVariationDuration(variation.duration ?? "");
    setVariationPrice(variation.price === null ? "" : String(variation.price).replace(".", ","));
    setVariationExamples(variation.examples ?? "");
  }

  function cancelVariationEdit() {
    setEditingVariationId(null);
    setVariationName("");
    setVariationDuration("");
    setVariationPrice("");
    setVariationExamples("");
  }

  async function submitVariationEdit(event: React.FormEvent<HTMLFormElement>, variationId: number) {
    event.preventDefault();

    if (!variationName.trim() || isSubmitting) return;

    const parsedPrice = parseMoneyInput(variationPrice);

    const updates = {
      name: variationName.trim(),
      duration: variationDuration.trim() || null,
      price: parsedPrice,
      examples: variationExamples.trim() || null,
    };

    try {
      setIsSubmitting(true);
      const res = await updateProcedureVariation(variationId, updates);
      if (res.success && res.data) {
        onUpdateVariation(procedure.id, variationId, {
          name: res.data.nome ?? updates.name,
          duration: res.data.duracao,
          price: res.data.valor,
          examples: res.data.exemplos,
        });
        cancelVariationEdit();
      } else {
        alert("Erro ao salvar no banco de dados: " + res.error);
      }
    } catch (err: unknown) {
      console.error("Failed to save variation:", err);
      alert("Erro de conexão ao salvar variação: " + (err instanceof Error ? err.message : "erro desconhecido"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteProcedure() {
    if (!confirmDeleteProcedure) {
      setConfirmDeleteProcedure(true);
      return;
    }
    try {
      setIsDeleting(true);
      const res = await deactivateProcedure(procedure.id);
      if (res.success) {
        onDeleteProcedure(procedure.id);
        if (onClose) onClose();
      } else {
        alert("Erro ao excluir procedimento: " + res.error);
        setConfirmDeleteProcedure(false);
      }
    } catch (err: unknown) {
      alert("Erro de conexão: " + (err instanceof Error ? err.message : "erro desconhecido"));
      setConfirmDeleteProcedure(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDeleteVariation(variationId: number) {
    if (confirmDeleteVariationId !== variationId) {
      setConfirmDeleteVariationId(variationId);
      return;
    }
    try {
      setIsDeleting(true);
      const res = await deleteVariation(variationId);
      if (res.success) {
        onDeleteVariation(procedure.id, variationId);
        setConfirmDeleteVariationId(null);
      } else {
        alert("Erro ao excluir variação: " + res.error);
        setConfirmDeleteVariationId(null);
      }
    } catch (err: unknown) {
      alert("Erro de conexão: " + (err instanceof Error ? err.message : "erro desconhecido"));
      setConfirmDeleteVariationId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className={cn("bg-white", isDrawer ? "flex h-full flex-col" : "rounded-lg border")}>
      <div className="border-b p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              <ListTree className="h-4 w-4" />
              Procedimento selecionado
            </p>
            <h2 className="text-xl font-semibold leading-tight sm:text-2xl">{procedure.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium">{procedure.variations.length || "Sem"} variação(ões)</span>
              <span className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium">{getPriceRange(procedure)}</span>
              <span className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium">{getDurationSummary(procedure)}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {confirmDeleteProcedure ? (
              <>
                <span className="hidden text-xs text-destructive sm:inline">Confirmar exclusão?</span>
                <Button variant="outline" size="sm" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={handleDeleteProcedure} disabled={isDeleting}>
                  <Trash2 className="h-3.5 w-3.5" />
                  {isDeleting ? "Excluindo..." : "Confirmar"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDeleteProcedure(false)} disabled={isDeleting}>Cancelar</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="hidden gap-2 md:inline-flex" onClick={() => setEditOpen((current) => !current)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex" onClick={() => setFormOpen((current) => !current)}>
                  <Plus className="h-4 w-4" />
                  Nova variação
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden h-9 w-9 px-0 text-muted-foreground hover:text-destructive sm:inline-flex"
                  aria-label="Excluir procedimento"
                  onClick={handleDeleteProcedure}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {onClose ? (
              <Button aria-label="Fechar detalhes" variant="ghost" size="sm" className="h-9 w-9 px-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{procedure.description ?? "Sem descrição cadastrada."}</p>
        <div className="mt-4 grid gap-2 sm:hidden">
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setEditOpen((current) => !current)}>
            <Pencil className="h-4 w-4" />
            Editar procedimento
          </Button>
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setFormOpen((current) => !current)}>
            <Plus className="h-4 w-4" />
            Nova variação
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-destructive hover:bg-destructive/10"
            onClick={handleDeleteProcedure}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {confirmDeleteProcedure ? (isDeleting ? "Excluindo..." : "Confirmar exclusão") : "Excluir procedimento"}
          </Button>
        </div>
      </div>

      <div className={cn("p-4 sm:p-5", isDrawer && "flex-1 overflow-y-auto")}>
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            editOpen ? "mb-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <form onSubmit={submitProcedure} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold">Editar procedimento</h3>
                <p className="mt-1 text-sm text-muted-foreground">Ajuste os dados principais do procedimento antes de mexer nas variações.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`procedure-name-${procedure.id}`}>Nome do procedimento</Label>
                  <Input id={`procedure-name-${procedure.id}`} value={editName} onChange={(event) => setEditName(event.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`procedure-description-${procedure.id}`}>Descrição</Label>
                  <textarea
                    id={`procedure-description-${procedure.id}`}
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`procedure-duration-${procedure.id}`}>Duração base</Label>
                  <Input id={`procedure-duration-${procedure.id}`} value={editDuration} onChange={(event) => setEditDuration(event.target.value)} placeholder="Ex.: 1h - 1h30min" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`procedure-price-${procedure.id}`}>Valor base</Label>
                  <Input id={`procedure-price-${procedure.id}`} value={editPrice} onChange={(event) => setEditPrice(event.target.value)} placeholder="Ex.: 250,00" inputMode="decimal" />
                </div>
              </div>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar procedimento</Button>
              </div>
            </form>
          </div>
        </div>

        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            formOpen ? "mb-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <form onSubmit={submitVariation} className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-4">
                <h3 className="font-semibold">Adicionar variação</h3>
                <p className="mt-1 text-sm text-muted-foreground">Essa variação aparece na tela agora; a persistência no Supabase fica para a próxima etapa.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`variation-name-${procedure.id}`}>Nome da variação</Label>
                  <Input id={`variation-name-${procedure.id}`} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Áreas grandes" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`variation-duration-${procedure.id}`}>Duração</Label>
                  <Input id={`variation-duration-${procedure.id}`} value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Ex.: 40 - 50 min" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`variation-price-${procedure.id}`}>Valor</Label>
                  <Input id={`variation-price-${procedure.id}`} value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Ex.: 120,00" inputMode="decimal" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`variation-examples-${procedure.id}`}>Exemplos ou observações</Label>
                  <textarea
                    id={`variation-examples-${procedure.id}`}
                    value={examples}
                    onChange={(event) => setExamples(event.target.value)}
                    className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex.: indicado para costas, pernas e ombros."
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
                <Button type="submit">Adicionar variação</Button>
              </div>
            </form>
          </div>
        </div>

        {procedure.variations.length > 0 ? (
          <div className="space-y-3">
            {procedure.variations.map((variation) => (
              <Card key={variation.id} className="transition-shadow duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  {editingVariationId === variation.id ? (
                    <form onSubmit={(event) => submitVariationEdit(event, variation.id)} className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">Editar variação</h3>
                          <p className="mt-1 text-sm text-muted-foreground">Atualize duração, valor e observações dessa opção.</p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-9 w-9 px-0" onClick={cancelVariationEdit} aria-label="Cancelar edição da variação">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor={`edit-variation-name-${variation.id}`}>Nome da variação</Label>
                          <Input id={`edit-variation-name-${variation.id}`} value={variationName} onChange={(event) => setVariationName(event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-variation-duration-${variation.id}`}>Duração</Label>
                          <Input id={`edit-variation-duration-${variation.id}`} value={variationDuration} onChange={(event) => setVariationDuration(event.target.value)} placeholder="Ex.: 40 - 50 min" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-variation-price-${variation.id}`}>Valor</Label>
                          <Input id={`edit-variation-price-${variation.id}`} value={variationPrice} onChange={(event) => setVariationPrice(event.target.value)} placeholder="Ex.: 120,00" inputMode="decimal" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor={`edit-variation-examples-${variation.id}`}>Exemplos ou observações</Label>
                          <textarea
                            id={`edit-variation-examples-${variation.id}`}
                            value={variationExamples}
                            onChange={(event) => setVariationExamples(event.target.value)}
                            className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={cancelVariationEdit} disabled={isSubmitting}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Salvando..." : "Salvar variação"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{variation.name}</h3>
                          <Button type="button" variant="outline" size="sm" className="h-8 gap-2" onClick={() => startVariationEdit(variation)}>
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                          {confirmDeleteVariationId === variation.id ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
                                onClick={() => handleDeleteVariation(variation.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-3 w-3" />
                                {isDeleting ? "Excluindo..." : "Confirmar"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => setConfirmDeleteVariationId(null)}
                                disabled={isDeleting}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 px-0 text-muted-foreground hover:text-destructive"
                              aria-label="Excluir variação"
                              onClick={() => handleDeleteVariation(variation.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        {variation.examples ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{variation.examples}</p> : null}
                      </div>
                      <div className="grid shrink-0 grid-cols-2 gap-2 sm:min-w-64">
                        <div className="rounded-md border p-3">
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Duração
                          </p>
                          <p className="mt-1 font-semibold">{variation.duration ?? "Sem duração"}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <DollarSign className="h-3.5 w-3.5" />
                            Valor
                          </p>
                          <p className="mt-1 font-semibold">{formatMoney(variation.price)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Duração</p>
                <p className="mt-1 font-semibold">{procedure.baseDuration ?? "Sem duração"}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="mt-1 font-semibold">{formatMoney(procedure.basePrice)}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

function CreateProcedureDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (procedure: ProcedureCatalogItem) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setName("");
    setDescription("");
    setDuration("");
    setPrice("");
  }

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || isSubmitting) return;

    const parsedPrice = parseMoneyInput(price);

    try {
      setIsSubmitting(true);
      const res = await createProcedure({
        name: name.trim(),
        description: description.trim() || null,
        duration: duration.trim() || null,
        price: parsedPrice,
      });

      if (res.success && res.data) {
        onCreated({
          id: res.data.id,
          name: res.data.nome ?? name.trim(),
          description: res.data.descricao,
          active: true,
          hasVariation: false,
          baseDuration: res.data.duracao,
          basePrice: res.data.valor,
          variations: [],
        });
        resetForm();
        onClose();
      } else {
        alert("Erro ao criar procedimento: " + res.error);
      }
    } catch (err: unknown) {
      alert("Erro de conexão: " + (err instanceof Error ? err.message : "erro desconhecido"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cn("fixed inset-0 z-[100] h-dvh", open ? "pointer-events-auto" : "pointer-events-none")}>
      <button
        type="button"
        aria-label="Fechar formulário"
        onClick={handleClose}
        className={cn("absolute inset-0 bg-black/25 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 flex h-dvh max-h-dvh w-[min(92vw,520px)] transform flex-col border-l bg-white shadow-2xl transition-transform duration-300 ease-out lg:w-[640px] 2xl:w-[720px]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="border-b p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <Plus className="h-4 w-4" />
                Novo procedimento
              </p>
              <h2 className="text-xl font-semibold leading-tight sm:text-2xl">Cadastrar procedimento</h2>
              <p className="mt-2 text-sm text-muted-foreground">Preencha as informações principais. Variações podem ser adicionadas depois.</p>
            </div>
            <Button aria-label="Fechar" variant="ghost" size="sm" className="h-9 w-9 px-0" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <form id="create-procedure-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-procedure-name">Nome do procedimento <span className="text-destructive">*</span></Label>
              <Input
                id="new-procedure-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Drenagem Linfática"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-procedure-description">Descrição</Label>
              <textarea
                id="new-procedure-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o procedimento brevemente..."
                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-procedure-duration">Duração base</Label>
                <Input
                  id="new-procedure-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ex.: 1h - 1h30min"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-procedure-price">Valor base</Label>
                <Input
                  id="new-procedure-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex.: 250,00"
                  inputMode="decimal"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="border-t p-4 sm:p-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" form="create-procedure-form" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Salvando..." : "Criar procedimento"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServicesCatalog({ procedures }: { procedures: ProcedureCatalogItem[] }) {
  const [catalog, setCatalog] = useState(procedures);
  const [selectedId, setSelectedId] = useState(procedures[0]?.id);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const filteredProcedures = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog;

    return catalog.filter((procedure) => {
      const inProcedure = `${procedure.name} ${procedure.description ?? ""}`.toLowerCase().includes(query);
      const inVariation = procedure.variations.some((variation) => `${variation.name} ${variation.examples ?? ""}`.toLowerCase().includes(query));
      return inProcedure || inVariation;
    });
  }, [catalog, search]);

  const selectedProcedure = catalog.find((procedure) => procedure.id === selectedId) ?? filteredProcedures[0] ?? catalog[0];

  function selectProcedure(procedureId: number) {
    setSelectedId(procedureId);
    setDrawerOpen(true);
  }

  function addVariation(procedureId: number, variation: Omit<ProcedureVariation, "id">) {
    setCatalog((current) => current.map((procedure) => {
      if (procedure.id !== procedureId) return procedure;

      const nextId = Date.now();
      return {
        ...procedure,
        hasVariation: true,
        variations: [...procedure.variations, { id: nextId, ...variation }],
      };
    }));
  }

  function updateProcedure(procedureId: number, updates: Pick<ProcedureCatalogItem, "name" | "description" | "baseDuration" | "basePrice">) {
    setCatalog((current) => current.map((procedure) => {
      if (procedure.id !== procedureId) return procedure;

      return {
        ...procedure,
        ...updates,
      };
    }));
  }

  function addProcedure(procedure: ProcedureCatalogItem) {
    setCatalog((current) => [...current, procedure]);
  }

  async function handleDeleteProcedureFromCatalog(procedureId: number) {
    setCatalog((current) => current.filter((p) => p.id !== procedureId));
  }

  function removeVariationFromCatalog(procedureId: number, variationId: number) {
    setCatalog((current) => current.map((procedure) => {
      if (procedure.id !== procedureId) return procedure;
      return {
        ...procedure,
        variations: procedure.variations.filter((v) => v.id !== variationId),
        hasVariation: procedure.variations.length > 1,
      };
    }));
  }

  function updateVariation(procedureId: number, variationId: number, updates: Omit<ProcedureVariation, "id">) {
    setCatalog((current) => current.map((procedure) => {
      if (procedure.id !== procedureId) return procedure;

      return {
        ...procedure,
        variations: procedure.variations.map((variation) => (
          variation.id === variationId ? { id: variation.id, ...updates } : variation
        )),
      };
    }));
  }

  const drawer = (
    <div className={cn("fixed inset-0 z-[100] h-dvh", drawerOpen ? "pointer-events-auto" : "pointer-events-none")}>
      <button
        type="button"
        aria-label="Fechar detalhes"
        onClick={() => setDrawerOpen(false)}
        className={cn("absolute inset-0 bg-black/25 transition-opacity duration-300 lg:bg-black/20", drawerOpen ? "opacity-100" : "opacity-0")}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 h-dvh max-h-dvh w-[min(92vw,520px)] transform border-l bg-white shadow-2xl transition-transform duration-300 ease-out lg:w-[640px] 2xl:w-[720px]",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {selectedProcedure ? (
          <ProcedureDetails
            key={selectedProcedure.id}
            procedure={selectedProcedure}
            onClose={() => setDrawerOpen(false)}
            onAddVariation={addVariation}
            onUpdateProcedure={updateProcedure}
            onUpdateVariation={updateVariation}
            onDeleteProcedure={handleDeleteProcedureFromCatalog}
            onDeleteVariation={removeVariationFromCatalog}
            isDrawer
          />
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procedimentos"
        description="Veja cada procedimento como item principal e consulte as variações com duração, valor e observações."
        actions={
          <Button className="w-full gap-2 sm:w-auto" onClick={() => setCreateDrawerOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo procedimento
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 pl-9" placeholder="Buscar procedimento ou variação" />
      </div>

      <div>
        <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredProcedures.map((procedure) => (
            <button
              key={procedure.id}
              type="button"
              onClick={() => selectProcedure(procedure.id)}
              className={cn(
                "w-full rounded-lg border bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-sm",
                selectedProcedure?.id === procedure.id && "border-primary shadow-sm",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{procedure.name}</h2>
                    {procedure.active ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Ativo
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{procedure.description ?? "Sem descrição cadastrada."}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                  <Sparkles className="hidden h-5 w-5 sm:block" />
                  <ChevronRight className="h-5 w-5 sm:hidden" />
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-md border p-2">
                  <p className="text-[11px] uppercase text-muted-foreground">Variações</p>
                  <p className="mt-1 font-semibold">{procedure.variations.length || "Não possui"}</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-[11px] uppercase text-muted-foreground">Valor</p>
                  <p className="mt-1 text-sm font-semibold">{getPriceRange(procedure)}</p>
                </div>
                <div className="rounded-md border p-2">
                  <p className="text-[11px] uppercase text-muted-foreground">Duração</p>
                  <p className="mt-1 text-sm font-semibold">{getDurationSummary(procedure)}</p>
                </div>
              </div>
            </button>
          ))}
        </section>
      </div>

      {portalReady ? createPortal(drawer, document.body) : null}
      {portalReady ? createPortal(
        <CreateProcedureDrawer
          open={createDrawerOpen}
          onClose={() => setCreateDrawerOpen(false)}
          onCreated={addProcedure}
        />,
        document.body
      ) : null}
    </div>
  );
}
