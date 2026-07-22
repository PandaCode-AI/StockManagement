-- Canceling via the Stripe billing portal defaults to "cancel at period end":
-- Stripe sends customer.subscription.updated with status still 'active' and
-- cancel_at_period_end true, and only sends customer.subscription.deleted
-- once the period actually ends. Without this column the app had no way to
-- distinguish "active, renewing" from "active, already canceled, access
-- ends on current_period_end" -- both looked identical ("Assinatura ativa").
alter table organizations
  add column if not exists cancel_at_period_end boolean not null default false;
