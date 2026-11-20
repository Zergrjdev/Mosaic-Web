-- Run once in YOUR OWN Supabase project (SQL Editor). Projects you create are stored here.
-- This version protects your data in the database itself:
--   * a project can only be READ by someone who knows its project id (x-room header)
--   * a project can only be CHANGED by someone who holds its edit key (x-edit header)
-- so read-only links really are read-only, and nobody can list other projects.
create table if not exists public.mosaic_items(
  room text not null, k text not null, id text not null, v jsonb,
  updated_at timestamptz not null default now(),
  primary key (room, k, id));
create index if not exists mosaic_items_room_updated on public.mosaic_items(room, updated_at);
create or replace function public.mosaic_touch() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists mosaic_touch on public.mosaic_items;
create trigger mosaic_touch before insert or update on public.mosaic_items for each row execute function public.mosaic_touch();

create or replace function public.mosaic_hdr(n text) returns text language sql stable as
$$ select coalesce((nullif(current_setting('request.headers', true), '')::json) ->> n, '') $$;
create or replace function public.mosaic_room_of(edit text) returns text language sql immutable as
$$ select case when coalesce(edit, '') = '' then null else left(encode(sha256(convert_to(edit, 'UTF8')), 'hex'), 32) end $$;
grant execute on function public.mosaic_hdr(text), public.mosaic_room_of(text) to anon;

alter table public.mosaic_items enable row level security;
drop policy if exists "mosaic anon access" on public.mosaic_items;
drop policy if exists mosaic_read on public.mosaic_items;
drop policy if exists mosaic_ins on public.mosaic_items;
drop policy if exists mosaic_upd on public.mosaic_items;
drop policy if exists mosaic_del on public.mosaic_items;
create policy mosaic_read on public.mosaic_items for select to anon using (room = public.mosaic_hdr('x-room'));
create policy mosaic_ins on public.mosaic_items for insert to anon with check (room = public.mosaic_room_of(public.mosaic_hdr('x-edit')));
create policy mosaic_upd on public.mosaic_items for update to anon using (room = public.mosaic_room_of(public.mosaic_hdr('x-edit'))) with check (room = public.mosaic_room_of(public.mosaic_hdr('x-edit')));
create policy mosaic_del on public.mosaic_items for delete to anon using (room = public.mosaic_room_of(public.mosaic_hdr('x-edit')));

-- File uploads (files live in a public bucket under an unguessable folder per project)
insert into storage.buckets (id, name, public, file_size_limit) values ('mosaic-files', 'mosaic-files', true, 52428800) on conflict (id) do nothing;
drop policy if exists "mosaic-files insert" on storage.objects;
create policy "mosaic-files insert" on storage.objects for insert to anon with check (bucket_id = 'mosaic-files');
drop policy if exists "mosaic-files select" on storage.objects;
create policy "mosaic-files select" on storage.objects for select to anon using (bucket_id = 'mosaic-files');
drop policy if exists "mosaic-files delete" on storage.objects;
create policy "mosaic-files delete" on storage.objects for delete to anon using (bucket_id = 'mosaic-files');
