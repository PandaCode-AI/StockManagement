-- Whether an invited Supervisora has actually finished activating her account
-- (set a password), not just whether the invite link was clicked -- link
-- clicks can happen from corporate email security scanners before the real
-- person ever sees the email, so auth.users.confirmed_at is not a reliable
-- signal on its own. encrypted_password is only set once
-- supabase.auth.updateUser({password}) succeeds in AcceptInvite.
create or replace function public.profile_auth_status(org_id_param uuid)
returns table(employee_id bigint, has_password boolean)
language sql
security definer
stable
set search_path = public
as $$
  select p.employee_id,
         (u.encrypted_password is not null and u.encrypted_password != '') as has_password
  from profile p
  join auth.users u on u.id = p.auth_user_id
  where p.org_id = org_id_param;
$$;
