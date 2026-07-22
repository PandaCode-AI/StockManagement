-- Stripe billing: one flat-fee subscription per organization. Every org
-- starts in 'trialing' at creation time (trial_ends_at set by the edge
-- function on signup-org) and moves through Stripe's subscription statuses
-- as webhooks arrive. subscription_status intentionally mirrors Stripe's own
-- status strings (trialing, active, past_due, canceled, incomplete,
-- unpaid) plus 'none' for an org that never started checkout.
alter table organizations
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists current_period_end timestamptz;

create index if not exists idx_organizations_stripe_customer on organizations(stripe_customer_id);

-- Orgs that already existed before this migration would otherwise land in
-- 'trialing' with a null trial_ends_at, which reads as "trial already
-- expired" to isSubscriptionActive() and locks them out immediately. Give
-- them a fresh 14-day trial instead, same as a brand-new signup.
update organizations
  set trial_ends_at = now() + interval '14 days'
  where trial_ends_at is null;
