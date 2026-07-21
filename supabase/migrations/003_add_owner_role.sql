-- Add a distinct "Owner" role (org's highest authority). "Super" is reserved,
-- unused by any route guard going forward, for a future platform-admin concept.
alter type user_role add value if not exists 'Owner';
