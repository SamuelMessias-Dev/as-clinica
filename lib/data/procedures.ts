import { getMockServicesByClinicId } from "@/lib/mocks/services";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import type { Procedimento, ProcedimentoVariacao, Service } from "@/lib/types/database";

const FALLBACK_CLINIC_ID = "clinic_demo_001";

export type ProcedureCatalogItem = {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  hasVariation: boolean;
  baseDuration: string | null;
  basePrice: number | null;
  variations: Array<{
    id: number;
    name: string;
    duration: string | null;
    price: number | null;
    examples: string | null;
  }>;
};

function parseDurationMinutes(duration: string | null) {
  if (!duration) return 0;

  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minuteMatch = duration.match(/(\d+)\s*min/i);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    return hours * 60 + minutes;
  }

  const firstNumber = duration.match(/\d+/);
  return firstNumber ? Number(firstNumber[0]) : 0;
}

function toPriceInCents(value: number | null) {
  return Math.round((value ?? 0) * 100);
}

function normalizeProcedure(procedimento: Procedimento, variation?: ProcedimentoVariacao): Service {
  const procedureName = procedimento.nome ?? "Procedimento";
  const variationName = variation?.nome;
  const duration = variation?.duracao ?? procedimento.duracao;
  const value = variation?.valor ?? procedimento.valor;

  return {
    id: variation ? `variacao_${variation.id}` : `procedimento_${procedimento.id}`,
    clinic_id: FALLBACK_CLINIC_ID,
    name: variationName ? `${procedureName} - ${variationName}` : procedureName,
    description: procedimento.descricao,
    duration_label: duration,
    duration_minutes: parseDurationMinutes(duration),
    price_in_cents: toPriceInCents(value),
    variation_id: variation ? String(variation.id) : null,
  };
}

function getMockCatalog(clinicId: string): ProcedureCatalogItem[] {
  return getMockServicesByClinicId(clinicId).map((service) => ({
    id: Number(service.id.replace(/\D/g, "")) || 0,
    name: service.name,
    description: null,
    active: true,
    hasVariation: false,
    baseDuration: `${service.duration_minutes} min`,
    basePrice: service.price_in_cents / 100,
    variations: [],
  }));
}

async function getRawProcedures(clinicId: string) {
  if (!hasSupabaseConfig()) {
    return { procedimentos: [] as Procedimento[], variacoes: [] as ProcedimentoVariacao[], fallback: getMockCatalog(clinicId) };
  }

  const supabase = await createClient();
  const { data: procedimentosData, error: procedimentosError } = await supabase
    .from("procedimentos")
    .select("*")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (procedimentosError) {
    console.error("Supabase procedimentos query failed:", procedimentosError.message);
    return { procedimentos: [] as Procedimento[], variacoes: [] as ProcedimentoVariacao[], fallback: getMockCatalog(clinicId) };
  }

  const procedimentos = (procedimentosData ?? []) as Procedimento[];

  if (!procedimentos.length) {
    return { procedimentos, variacoes: [] as ProcedimentoVariacao[], fallback: [] as ProcedureCatalogItem[] };
  }

  const procedureIds = procedimentos.map((procedimento) => procedimento.id);
  const { data: variacoesData, error: variacoesError } = await supabase
    .from("procedimento_variacao")
    .select("*")
    .in("procedimento_id", procedureIds)
    .order("nome", { ascending: true });

  if (variacoesError) {
    console.error("Supabase procedimento_variacao query failed:", variacoesError.message);
  }

  return {
    procedimentos,
    variacoes: (variacoesData ?? []) as ProcedimentoVariacao[],
    fallback: [] as ProcedureCatalogItem[],
  };
}

export async function getProceduresCatalog(clinicId: string) {
  const { procedimentos, variacoes, fallback } = await getRawProcedures(clinicId);

  if (fallback.length || !procedimentos.length) {
    return fallback;
  }

  const variacoesByProcedimento = new Map<number, ProcedimentoVariacao[]>();

  for (const variacao of variacoes) {
    if (!variacao.procedimento_id) continue;
    const current = variacoesByProcedimento.get(variacao.procedimento_id) ?? [];
    current.push(variacao);
    variacoesByProcedimento.set(variacao.procedimento_id, current);
  }

  return procedimentos.map((procedimento) => ({
    id: procedimento.id,
    name: procedimento.nome ?? "Procedimento",
    description: procedimento.descricao,
    active: Boolean(procedimento.ativo),
    hasVariation: Boolean(procedimento.possui_variacao),
    baseDuration: procedimento.duracao,
    basePrice: procedimento.valor,
    variations: (variacoesByProcedimento.get(procedimento.id) ?? []).map((variation) => ({
      id: variation.id,
      name: variation.nome ?? "Variação",
      duration: variation.duracao,
      price: variation.valor,
      examples: variation.exemplos,
    })),
  }));
}

export async function getServicesByClinicId(clinicId: string) {
  const { procedimentos, variacoes, fallback } = await getRawProcedures(clinicId);

  if (fallback.length) {
    return getMockServicesByClinicId(clinicId);
  }

  if (!procedimentos.length) {
    return [];
  }

  const variacoesByProcedimento = new Map<number, ProcedimentoVariacao[]>();

  for (const variacao of variacoes) {
    if (!variacao.procedimento_id) continue;
    const current = variacoesByProcedimento.get(variacao.procedimento_id) ?? [];
    current.push(variacao);
    variacoesByProcedimento.set(variacao.procedimento_id, current);
  }

  return procedimentos.flatMap((procedimento) => {
    const variations = variacoesByProcedimento.get(procedimento.id);

    if (procedimento.possui_variacao && variations?.length) {
      return variations.map((variation) => normalizeProcedure(procedimento, variation));
    }

    return [normalizeProcedure(procedimento)];
  });
}
