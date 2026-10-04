-- Keep this enum change in its own migration. PostgreSQL does not allow a newly
-- added enum value to be used by policies/functions until the transaction that
-- added it has committed.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'catalog_editor';
