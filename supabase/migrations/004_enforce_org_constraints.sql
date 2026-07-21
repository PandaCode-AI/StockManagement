-- Applied after confirming zero NULL org_id rows and backfilling any real data.
alter table profile
  alter column org_id set not null,
  add constraint profile_org_fk foreign key (org_id) references organizations(org_id),
  add constraint profile_auth_user_unique unique (auth_user_id);

alter table items
  alter column org_id set not null,
  add constraint items_org_fk foreign key (org_id) references organizations(org_id),
  add constraint items_org_sku_unique unique (org_id, sku);

alter table inventory_transactions
  alter column org_id set not null,
  add constraint tx_org_fk foreign key (org_id) references organizations(org_id);

alter table last_movements
  alter column org_id set not null,
  add constraint lm_org_fk foreign key (org_id) references organizations(org_id);

create index if not exists idx_items_org on items(org_id);
create index if not exists idx_transactions_org on inventory_transactions(org_id);
create index if not exists idx_last_movements_org on last_movements(org_id);
create index if not exists idx_profile_org on profile(org_id);
create index if not exists idx_profile_auth_user on profile(auth_user_id);
