-- FALLBACK ONLY. Use this if the app says your Supabase blocked the extra security headers.
-- It returns your table to open access (anyone with your anon key can read and write every project).
drop policy if exists mosaic_read on public.mosaic_items;
drop policy if exists mosaic_ins on public.mosaic_items;
drop policy if exists mosaic_upd on public.mosaic_items;
drop policy if exists mosaic_del on public.mosaic_items;
drop policy if exists "mosaic anon access" on public.mosaic_items;
create policy "mosaic anon access" on public.mosaic_items for all to anon using (true) with check (true);
