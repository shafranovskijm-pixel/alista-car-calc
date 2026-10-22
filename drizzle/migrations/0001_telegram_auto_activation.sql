ALTER TABLE public.telegram_settings
  ADD COLUMN IF NOT EXISTS auto_activate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'not_configured';
ALTER TABLE public.telegram_posts
  ADD COLUMN IF NOT EXISTS text_update_id bigint NOT NULL DEFAULT 0;
ALTER TABLE public.telegram_post_messages
  ADD COLUMN IF NOT EXISTS photo_error text;

-- Version is the pair (edit_date, update_id): update_id breaks ties between two
-- edits made within the same second.
CREATE OR REPLACE FUNCTION public.telegram_upsert_car(
  p_group_key text, p_chat_id bigint, p_message_id bigint, p_version bigint, p_update_id bigint, p_car jsonb
) RETURNS TABLE (car_id uuid, outcome text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_post public.telegram_posts%ROWTYPE;
  v_car uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('telegram:' || p_group_key));
  SELECT * INTO v_post FROM public.telegram_posts WHERE group_key = p_group_key;

  IF FOUND AND v_post.car_id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, 'car_deleted'::text;
    RETURN;
  END IF;

  IF FOUND AND (p_version, p_update_id) = (v_post.text_version, v_post.text_update_id) THEN
    RETURN QUERY SELECT v_post.car_id, 'unchanged'::text;
    RETURN;
  END IF;

  IF FOUND AND (p_version, p_update_id) < (v_post.text_version, v_post.text_update_id) THEN
    RETURN QUERY SELECT v_post.car_id, 'stale'::text;
    RETURN;
  END IF;

  IF NOT FOUND THEN
    INSERT INTO public.cars (slug, title, brand, model, year, country, price, currency, status,
      description, mileage_km, engine_volume, power_hp, transmission, fuel)
    VALUES (
      p_car->>'slug', p_car->>'title', p_car->>'brand', p_car->>'model',
      (p_car->>'year')::int, (p_car->>'country')::public.car_country,
      (p_car->>'price')::numeric, p_car->>'currency', (p_car->>'status')::public.car_status,
      p_car->>'description', (p_car->>'mileage_km')::int, (p_car->>'engine_volume')::numeric,
      (p_car->>'power_hp')::int, (p_car->>'transmission')::public.car_transmission,
      (p_car->>'fuel')::public.car_fuel
    ) RETURNING id INTO v_car;
    INSERT INTO public.telegram_posts (group_key, chat_id, caption_message_id, car_id, text_version, text_update_id)
    VALUES (p_group_key, p_chat_id, p_message_id, v_car, p_version, p_update_id);
    RETURN QUERY SELECT v_car, 'created'::text;
    RETURN;
  END IF;

  UPDATE public.cars SET
    title = p_car->>'title', brand = p_car->>'brand', model = p_car->>'model',
    year = (p_car->>'year')::int, country = (p_car->>'country')::public.car_country,
    price = (p_car->>'price')::numeric, currency = p_car->>'currency',
    status = (p_car->>'status')::public.car_status, description = p_car->>'description',
    mileage_km = (p_car->>'mileage_km')::int, engine_volume = (p_car->>'engine_volume')::numeric,
    power_hp = (p_car->>'power_hp')::int,
    transmission = (p_car->>'transmission')::public.car_transmission,
    fuel = (p_car->>'fuel')::public.car_fuel
  WHERE id = v_post.car_id;
  UPDATE public.telegram_posts
  SET text_version = p_version, text_update_id = p_update_id, caption_message_id = p_message_id, updated_at = now()
  WHERE group_key = p_group_key;
  RETURN QUERY SELECT v_post.car_id, 'updated'::text;
END;
$$;

REVOKE ALL ON FUNCTION public.telegram_upsert_car(text, bigint, bigint, bigint, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_upsert_car(text, bigint, bigint, bigint, bigint, jsonb) TO service_role;
COMMENT ON FUNCTION public.telegram_upsert_car(text, bigint, bigint, bigint, jsonb) IS 'DEPRECATED: replaced by the overload with p_update_id';