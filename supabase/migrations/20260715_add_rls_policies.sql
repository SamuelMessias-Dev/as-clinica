alter table public.procedimentos enable row level security;
alter table public.procedimento_variacao enable row level security;
alter table public.leads enable row level security;
alter table public.dados_leads enable row level security;
alter table public.lead_procedimentos enable row level security;
alter table public.profissionais enable row level security;
alter table public.agendamento enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'procedimentos'
      and policyname = 'Anonymous can read active procedures'
  ) then
    create policy "Anonymous can read active procedures"
      on public.procedimentos
      for select
      to anon
      using (ativo is true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'procedimentos'
      and policyname = 'Authenticated can read procedures'
  ) then
    create policy "Authenticated can read procedures"
      on public.procedimentos
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'procedimentos'
      and policyname = 'Authenticated can manage procedures'
  ) then
    create policy "Authenticated can manage procedures"
      on public.procedimentos
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'procedimento_variacao'
      and policyname = 'Anonymous can read active procedure variations'
  ) then
    create policy "Anonymous can read active procedure variations"
      on public.procedimento_variacao
      for select
      to anon
      using (
        exists (
          select 1
          from public.procedimentos p
          where p.id = procedimento_id
            and p.ativo is true
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'procedimento_variacao'
      and policyname = 'Authenticated can read procedure variations'
  ) then
    create policy "Authenticated can read procedure variations"
      on public.procedimento_variacao
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'procedimento_variacao'
      and policyname = 'Authenticated can manage procedure variations'
  ) then
    create policy "Authenticated can manage procedure variations"
      on public.procedimento_variacao
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'leads'
      and policyname = 'Authenticated can manage leads'
  ) then
    create policy "Authenticated can manage leads"
      on public.leads
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'dados_leads'
      and policyname = 'Authenticated can manage lead data'
  ) then
    create policy "Authenticated can manage lead data"
      on public.dados_leads
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lead_procedimentos'
      and policyname = 'Authenticated can manage lead procedures'
  ) then
    create policy "Authenticated can manage lead procedures"
      on public.lead_procedimentos
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profissionais'
      and policyname = 'Authenticated can manage professionals'
  ) then
    create policy "Authenticated can manage professionals"
      on public.profissionais
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'agendamento'
      and policyname = 'Authenticated can manage appointments'
  ) then
    create policy "Authenticated can manage appointments"
      on public.agendamento
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public upload clientes photos'
  ) then
    drop policy "Public upload clientes photos" on storage.objects;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public update clientes photos'
  ) then
    drop policy "Public update clientes photos" on storage.objects;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public delete clientes photos'
  ) then
    drop policy "Public delete clientes photos" on storage.objects;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public upload profissionais photos'
  ) then
    drop policy "Public upload profissionais photos" on storage.objects;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public update profissionais photos'
  ) then
    drop policy "Public update profissionais photos" on storage.objects;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public delete profissionais photos'
  ) then
    drop policy "Public delete profissionais photos" on storage.objects;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anyone can read clinic photos'
  ) then
    create policy "Anyone can read clinic photos"
      on storage.objects
      for select
      to public
      using (bucket_id in ('clientes', 'profissionais'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated can upload clinic photos'
  ) then
    create policy "Authenticated can upload clinic photos"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id in ('clientes', 'profissionais'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated can update clinic photos'
  ) then
    create policy "Authenticated can update clinic photos"
      on storage.objects
      for update
      to authenticated
      using (bucket_id in ('clientes', 'profissionais'))
      with check (bucket_id in ('clientes', 'profissionais'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated can delete clinic photos'
  ) then
    create policy "Authenticated can delete clinic photos"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id in ('clientes', 'profissionais'));
  end if;
end $$;
