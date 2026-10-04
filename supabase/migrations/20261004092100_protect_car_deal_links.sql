CREATE OR REPLACE FUNCTION public.protect_car_deal_link_from_catalog_editor()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  actor_id uuid := auth.uid();
BEGIN
  -- Admins and managers keep the CRM ability to link cars to deals. Calls made
  -- by service/database roles also bypass this user-facing restriction.
  IF current_user = 'authenticated'
    AND public.has_role(actor_id, 'catalog_editor'::public.app_role)
    AND NOT public.has_role(actor_id, 'admin'::public.app_role)
    AND NOT public.has_role(actor_id, 'manager'::public.app_role)
    AND (
      (TG_OP = 'INSERT' AND NEW.deal_id IS NOT NULL)
      OR (TG_OP = 'UPDATE' AND NEW.deal_id IS DISTINCT FROM OLD.deal_id)
      OR (TG_OP = 'DELETE' AND OLD.deal_id IS NOT NULL)
    )
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'catalog_editor cannot change cars.deal_id';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_car_deal_link_from_catalog_editor ON public.cars;

CREATE TRIGGER protect_car_deal_link_from_catalog_editor
  BEFORE INSERT OR UPDATE OR DELETE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_car_deal_link_from_catalog_editor();

REVOKE ALL ON FUNCTION public.protect_car_deal_link_from_catalog_editor()
FROM PUBLIC, anon, authenticated;
