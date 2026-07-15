alter table if exists public.profissionais
  add column if not exists agenda_inicio text not null default '08:00',
  add column if not exists agenda_fim text not null default '18:00',
  add column if not exists agenda_pausa_inicio text not null default '12:00',
  add column if not exists agenda_pausa_fim text not null default '13:00',
  add column if not exists agenda_dias_semana int[] not null default array[1, 2, 3, 4, 5]::int[];
