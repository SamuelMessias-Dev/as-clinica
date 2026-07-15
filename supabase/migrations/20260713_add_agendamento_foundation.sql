alter table public.agendamento
  add column if not exists data_inicio timestamp with time zone,
  add column if not exists data_fim timestamp with time zone,
  add column if not exists hora_inicio text,
  add column if not exists hora_fim text,
  add column if not exists profissional_id bigint references public.profissionais(id) on delete set null,
  add column if not exists status text default 'confirmado',
  add column if not exists observacoes text,
  add column if not exists valor_final numeric,
  add column if not exists origem text,
  add column if not exists cliente_nome_snapshot text,
  add column if not exists cliente_celular_snapshot text,
  add column if not exists profissional_nome_snapshot text,
  add column if not exists procedimento_nome_snapshot text,
  add column if not exists variacao_nome_snapshot text;

create index if not exists agendamento_data_inicio_idx on public.agendamento (data_inicio);
create index if not exists agendamento_profissional_id_idx on public.agendamento (profissional_id);
create index if not exists agendamento_lead_idx on public.agendamento (lead);
