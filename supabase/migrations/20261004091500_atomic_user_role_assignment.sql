CREATE OR REPLACE FUNCTION public.replace_user_role(
  _user_id uuid,
  _role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  existing_role public.app_role;
BEGIN
  -- Serialize all administrator-role changes so two concurrent requests cannot
  -- demote the final administrators at the same time.
  PERFORM pg_advisory_xact_lock(hashtext('public.user_roles.admin_invariant'));

  SELECT role
  INTO existing_role
  FROM public.user_roles
  WHERE user_id = _user_id
  FOR UPDATE;

  IF existing_role = 'admin'::public.app_role
    AND _role <> 'admin'::public.app_role
    AND (
      SELECT count(*)
      FROM public.user_roles
      WHERE role = 'admin'::public.app_role
    ) <= 1
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Нельзя изменить роль последнего администратора';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    GROUP BY user_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce one role per user: duplicate role rows exist';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_roles'::regclass
      AND conname = 'user_roles_user_id_key'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_user_role(uuid, public.app_role)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_user_role(uuid, public.app_role)
TO service_role;
