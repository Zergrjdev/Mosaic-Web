-- PLUGIN STORE. Run once in the CENTRAL Supabase (SQL Editor), after central-setup.sql. Safe to run again.
-- Anyone can read APPROVED plugins. Any signed-in account can submit one (it starts as "pending").
-- Only developers (mosaic_devs, which includes the owner) can approve, reject or remove. Submitted code can never be edited,
-- so what a reviewer read is exactly what people install (the app also checks the SHA-256 on install and on every start).

create table if not exists public.mosaic_plugins(
  id uuid primary key default gen_random_uuid(),
  pid text not null check (pid ~ '^[a-z0-9][a-z0-9-]{2,40}$'),
  version text not null check (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 400),
  author text not null default '' check (char_length(author) <= 60),
  owner uuid not null references auth.users(id) on delete cascade,
  owner_name text check (char_length(owner_name) <= 60),
  manifest jsonb not null,
  code text not null check (char_length(code) between 20 and 300000),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending','approved','rejected','removed')),
  review_note text check (char_length(review_note) <= 500),
  reviewed_by uuid,
  reviewed_at timestamptz,
  installs integer not null default 0,
  created_at timestamptz not null default now(),
  unique (pid, version)
);
create index if not exists mosaic_plugins_status on public.mosaic_plugins(status, created_at desc);
alter table public.mosaic_plugins enable row level security;

create or replace function public.mosaic_plugins_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.pid in ('example-asset-report') and auth.uid() is not null and not public.is_dev() then
      raise exception 'That plugin id is reserved';
    end if;
    if exists(select 1 from public.mosaic_plugins p where p.pid = new.pid and p.owner <> new.owner) then
      raise exception 'That plugin id belongs to someone else';
    end if;
    if auth.uid() is not null and not public.is_dev() then
      new.status := 'pending'; new.installs := 0; new.review_note := null; new.reviewed_by := null; new.reviewed_at := null;
      if (select count(*) from public.mosaic_plugins p where p.owner = new.owner and p.status = 'pending') >= 5 then
        raise exception 'You already have 5 plugins waiting for review';
      end if;
    end if;
    new.created_at := now();
    return new;
  end if;
  -- UPDATE: the code, manifest and identity are frozen
  if new.pid <> old.pid or new.version <> old.version or new.owner <> old.owner or new.code <> old.code
     or new.manifest <> old.manifest or new.sha256 <> old.sha256 or new.created_at <> old.created_at then
    raise exception 'A submitted plugin cannot be edited. Submit a new version instead.';
  end if;
  if new.installs <> old.installs then
    if coalesce(current_setting('mosaic.install', true), '') <> '1' then raise exception 'Not allowed'; end if;
    return new;
  end if;
  if auth.uid() is not null and not public.is_dev() then raise exception 'Only reviewers can change a plugin''s status'; end if;
  if new.status <> old.status then new.reviewed_by := auth.uid(); new.reviewed_at := now(); end if;
  return new;
end $$;
drop trigger if exists mosaic_plugins_guard on public.mosaic_plugins;
create trigger mosaic_plugins_guard before insert or update on public.mosaic_plugins for each row execute function public.mosaic_plugins_guard();

drop policy if exists plugins_read on public.mosaic_plugins;
create policy plugins_read on public.mosaic_plugins for select to anon, authenticated
  using (status = 'approved' or owner = auth.uid() or public.is_dev());
drop policy if exists plugins_ins on public.mosaic_plugins;
create policy plugins_ins on public.mosaic_plugins for insert to authenticated with check (owner = auth.uid());
drop policy if exists plugins_upd on public.mosaic_plugins;
create policy plugins_upd on public.mosaic_plugins for update to authenticated using (public.is_dev()) with check (public.is_dev());
drop policy if exists plugins_del on public.mosaic_plugins;
create policy plugins_del on public.mosaic_plugins for delete to authenticated
  using (public.is_dev() or (owner = auth.uid() and status in ('pending','rejected')));
grant select on public.mosaic_plugins to anon, authenticated;
grant insert, update, delete on public.mosaic_plugins to authenticated;

-- Install counter (anyone may call it, it only ever adds 1 to an approved plugin).
create or replace function public.plugin_install(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('mosaic.install', '1', true);
  update public.mosaic_plugins set installs = installs + 1 where id = p_id and status = 'approved';
end $$;
revoke all on function public.plugin_install(uuid) from public;
grant execute on function public.plugin_install(uuid) to anon, authenticated;
