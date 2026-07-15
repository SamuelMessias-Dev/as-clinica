alter table public.profissionais
  add column if not exists foto_url text;

insert into storage.buckets (id, name, public)
values ('profissionais', 'profissionais', true)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read profissionais photos'
  ) then
    create policy "Public read profissionais photos"
      on storage.objects
      for select
      to public
      using (bucket_id = 'profissionais');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public upload profissionais photos'
  ) then
    create policy "Public upload profissionais photos"
      on storage.objects
      for insert
      to public
      with check (bucket_id = 'profissionais');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public update profissionais photos'
  ) then
    create policy "Public update profissionais photos"
      on storage.objects
      for update
      to public
      using (bucket_id = 'profissionais')
      with check (bucket_id = 'profissionais');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public delete profissionais photos'
  ) then
    create policy "Public delete profissionais photos"
      on storage.objects
      for delete
      to public
      using (bucket_id = 'profissionais');
  end if;
end $$;
