-- Reject public/self-service Auth sign-ups at the database boundary while
-- keeping the server-side inviteUserByEmail flow working.
--
-- GoTrue inserts auth.users first and sets invited_at later in the same invite
-- transaction. A normal AFTER INSERT trigger therefore cannot distinguish an
-- invite from self-sign-up. Deferring the constraint trigger until transaction
-- end lets handle_new_user inspect the final, server-owned invited_at value.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  user_invited_at timestamptz;
BEGIN
  SELECT auth_user.invited_at
  INTO user_invited_at
  FROM auth.users AS auth_user
  WHERE auth_user.id = NEW.id;

  IF user_invited_at IS NULL THEN
    RAISE EXCEPTION 'Self-service sign-up is disabled; use an administrator invitation'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE CONSTRAINT TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
