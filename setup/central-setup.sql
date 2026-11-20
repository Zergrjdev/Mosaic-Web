-- CENTRAL Supabase project (the one baked into index.html: accounts, directory, dev tools).
-- Run once in Supabase > SQL Editor. Then sign up on the site as egertonzac@gmail.com FIRST.

create table if not exists public.mosaic_devs(user_id uuid primary key references auth.users(id) on delete cascade, email text, granted_by uuid, created_at timestamptz not null default now());
create table if not exists public.mosaic_projects(rid text primary key, owner uuid not null references auth.users(id) on delete cascade, owner_email text, title text, sb_url text not null, sb_key text not null, sec boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.mosaic_pool(id bigserial primary key, owner uuid not null references auth.users(id) on delete cascade, owner_email text, label text, sb_url text not null, sb_key text not null, sec boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.mosaic_audit(id bigserial primary key, actor uuid, actor_email text, action text not null, target text, at timestamptz not null default now());
alter table public.mosaic_projects add column if not exists sec boolean not null default false;
alter table public.mosaic_pool add column if not exists sec boolean not null default false;
-- Upgrade for installs made before multi-Supabase support: one person can now pool several connections.
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='mosaic_pool' and column_name='id') then
    alter table public.mosaic_pool add column id bigserial;
    alter table public.mosaic_pool drop constraint if exists mosaic_pool_pkey;
    alter table public.mosaic_pool add primary key (id);
  end if;
end $$;
create unique index if not exists mosaic_pool_owner_url on public.mosaic_pool(owner, sb_url);
alter table public.mosaic_devs enable row level security;
alter table public.mosaic_projects enable row level security;
alter table public.mosaic_pool enable row level security;
alter table public.mosaic_audit enable row level security;

create or replace function public.is_dev() returns boolean language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.mosaic_devs where user_id = auth.uid()) $$;

drop policy if exists devs_read on public.mosaic_devs;
create policy devs_read on public.mosaic_devs for select to authenticated using (user_id = auth.uid() or public.is_dev());
drop policy if exists proj_read on public.mosaic_projects;
create policy proj_read on public.mosaic_projects for select to authenticated using (owner = auth.uid() or public.is_dev());
drop policy if exists proj_ins on public.mosaic_projects;
create policy proj_ins on public.mosaic_projects for insert to authenticated with check (owner = auth.uid());
drop policy if exists proj_upd on public.mosaic_projects;
create policy proj_upd on public.mosaic_projects for update to authenticated using (owner = auth.uid());
drop policy if exists proj_del on public.mosaic_projects;
create policy proj_del on public.mosaic_projects for delete to authenticated using (owner = auth.uid());
drop policy if exists pool_read on public.mosaic_pool;
create policy pool_read on public.mosaic_pool for select to authenticated using (owner = auth.uid() or public.is_dev());
drop policy if exists pool_ins on public.mosaic_pool;
create policy pool_ins on public.mosaic_pool for insert to authenticated with check (owner = auth.uid());
drop policy if exists pool_upd on public.mosaic_pool;
create policy pool_upd on public.mosaic_pool for update to authenticated using (owner = auth.uid());
drop policy if exists pool_del on public.mosaic_pool;
create policy pool_del on public.mosaic_pool for delete to authenticated using (owner = auth.uid());
drop policy if exists audit_read on public.mosaic_audit;
create policy audit_read on public.mosaic_audit for select to authenticated using (public.is_dev());
drop policy if exists audit_ins on public.mosaic_audit;
create policy audit_ins on public.mosaic_audit for insert to authenticated with check (public.is_dev() and actor = auth.uid());

-- The owner account becomes a developer the first time it signs in with a CONFIRMED email.
create or replace function public.claim_owner() returns boolean language plpgsql security definer set search_path = public, auth as $$
declare u auth.users%rowtype;
begin
  select * into u from auth.users where id = auth.uid();
  if u.id is null or lower(u.email) <> 'egertonzac@gmail.com' or u.email_confirmed_at is null then return false; end if;
  insert into public.mosaic_devs(user_id, email) values (u.id, u.email) on conflict do nothing;
  return true;
end $$;

create or replace function public.grant_dev(target text) returns void language plpgsql security definer set search_path = public, auth as $$
declare t auth.users%rowtype;
begin
  if not public.is_dev() then raise exception 'Not allowed'; end if;
  select * into t from auth.users where lower(email) = lower(target);
  if t.id is null then raise exception 'No account with that email'; end if;
  insert into public.mosaic_devs(user_id, email, granted_by) values (t.id, t.email, auth.uid()) on conflict do nothing;
  insert into public.mosaic_audit(actor, actor_email, action, target) values (auth.uid(), (select email from auth.users where id = auth.uid()), 'grant_dev', t.email);
end $$;

create or replace function public.revoke_dev(target text) returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_dev() then raise exception 'Not allowed'; end if;
  if lower(target) = 'egertonzac@gmail.com' then raise exception 'The owner cannot be removed'; end if;
  delete from public.mosaic_devs where lower(email) = lower(target);
  insert into public.mosaic_audit(actor, actor_email, action, target) values (auth.uid(), (select email from auth.users where id = auth.uid()), 'revoke_dev', target);
end $$;

-- Lets people erase their own account (privacy law: right to deletion).
create or replace function public.delete_my_account() returns void language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid()
$$;

revoke all on function public.is_dev(), public.claim_owner(), public.grant_dev(text), public.revoke_dev(text), public.delete_my_account() from public, anon;
grant execute on function public.is_dev(), public.claim_owner(), public.grant_dev(text), public.revoke_dev(text), public.delete_my_account() to authenticated;


-- Discover: projects people choose to make public (read-only for everyone).
create table if not exists public.mosaic_public(
  rid text primary key, owner uuid not null references auth.users(id) on delete cascade, owner_name text,
  title text not null, description text, sb_url text not null, sb_key text not null, sec boolean not null default false,
  created_at timestamptz not null default now());
alter table public.mosaic_public enable row level security;
drop policy if exists pub_read on public.mosaic_public;
create policy pub_read on public.mosaic_public for select to anon, authenticated using (true);
drop policy if exists pub_ins on public.mosaic_public;
create policy pub_ins on public.mosaic_public for insert to authenticated with check (owner = auth.uid());
drop policy if exists pub_upd on public.mosaic_public;
create policy pub_upd on public.mosaic_public for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists pub_del on public.mosaic_public;
create policy pub_del on public.mosaic_public for delete to authenticated using (owner = auth.uid() or public.is_dev());
grant select on public.mosaic_public to anon, authenticated;
