alter table public.leads
  add column if not exists email text,
  add column if not exists descricao text,
  add column if not exists foto_url text;

insert into storage.buckets (id, name, public)
values ('clientes', 'clientes', true)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read clientes photos'
  ) then
    create policy "Public read clientes photos"
      on storage.objects
      for select
      to public
      using (bucket_id = 'clientes');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public upload clientes photos'
  ) then
    create policy "Public upload clientes photos"
      on storage.objects
      for insert
      to public
      with check (bucket_id = 'clientes');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public update clientes photos'
  ) then
    create policy "Public update clientes photos"
      on storage.objects
      for update
      to public
      using (bucket_id = 'clientes')
      with check (bucket_id = 'clientes');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public delete clientes photos'
  ) then
    create policy "Public delete clientes photos"
      on storage.objects
      for delete
      to public
      using (bucket_id = 'clientes');
  end if;
end $$;
