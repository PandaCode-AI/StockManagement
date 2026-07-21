-- Closes the direct-REST-access gap: today (pre-migration) any authenticated
-- user can read/write every row of every table via Supabase's auto-exposed
-- PostgREST API, regardless of org. The app itself is unaffected either way
-- since it always goes through the edge function's service-role client,
-- which bypasses RLS entirely -- this migration is the real tenant boundary
-- against direct REST access, not defense-in-depth on an already-safe path.

create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from public.profile where auth_user_id = auth.uid() limit 1;
$$;

-- items
drop policy if exists "Enable read access for all users" on items;
drop policy if exists "Enable all access for authenticated users" on items;

create policy "org_isolation_select" on items for select
  to authenticated using (org_id = public.current_org_id());

create policy "org_isolation_write" on items for all
  to authenticated using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- inventory_transactions
drop policy if exists "Enable read access for all users" on inventory_transactions;
drop policy if exists "Enable insert for authenticated users" on inventory_transactions;

create policy "org_isolation_select" on inventory_transactions for select
  to authenticated using (org_id = public.current_org_id());

create policy "org_isolation_insert" on inventory_transactions for insert
  to authenticated with check (org_id = public.current_org_id());

-- last_movements
drop policy if exists "Enable read access for all users" on last_movements;
drop policy if exists "Enable insert for authenticated users" on last_movements;

create policy "org_isolation_select" on last_movements for select
  to authenticated using (org_id = public.current_org_id());

create policy "org_isolation_insert" on last_movements for insert
  to authenticated with check (org_id = public.current_org_id());

-- profile (keep the existing service_role insert/update policies -- the edge
-- function still needs to write profiles as service role during signup)
drop policy if exists "Enable read access for all users" on profile;

create policy "org_isolation_select" on profile for select
  to authenticated using (org_id = public.current_org_id());
