-- Nullable additive columns -- safe with existing app/rows, enforced NOT NULL in 004 after backfill.
alter table profile add column if not exists org_id uuid;
alter table profile add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

alter table items add column if not exists org_id uuid;
alter table inventory_transactions add column if not exists org_id uuid;
alter table last_movements add column if not exists org_id uuid;
