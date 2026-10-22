CREATE TABLE IF NOT EXISTS public.telegram_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  channel_username text,
  channel_id bigint,
  channel_title text,
  bot_id bigint,
  bot_username text,
  webhook_status text,
  webhook_checked_at timestamptz,
  verified_at timestamptz,
  last_imported_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.telegram_settings FROM anon, authenticated;
GRANT ALL ON public.telegram_settings TO service_role;
ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.telegram_secrets (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  bot_token text NOT NULL,
  webhook_secret text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.telegram_secrets FROM anon, authenticated;
GRANT ALL ON public.telegram_secrets TO service_role;
ALTER TABLE public.telegram_secrets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.telegram_posts (
  group_key text PRIMARY KEY,
  chat_id bigint NOT NULL,
  caption_message_id bigint,
  car_id uuid REFERENCES public.cars(id) ON DELETE SET NULL,
  text_version bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.telegram_posts FROM anon, authenticated;
GRANT ALL ON public.telegram_posts TO service_role;
ALTER TABLE public.telegram_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.telegram_post_messages (
  chat_id bigint NOT NULL,
  message_id bigint NOT NULL,
  group_key text NOT NULL,
  file_id text,
  file_unique_id text,
  mime_type text,
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, message_id)
);
CREATE INDEX IF NOT EXISTS telegram_post_messages_group_idx ON public.telegram_post_messages (group_key);
REVOKE ALL ON public.telegram_post_messages FROM anon, authenticated;
GRANT ALL ON public.telegram_post_messages TO service_role;
ALTER TABLE public.telegram_post_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.telegram_updates (
  update_id bigint PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.telegram_updates FROM anon, authenticated;
GRANT ALL ON public.telegram_updates TO service_role;
ALTER TABLE public.telegram_updates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.telegram_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_key text,
  message_id bigint,
  car_id uuid,
  status text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS telegram_imports_created_idx ON public.telegram_imports (created_at DESC);
REVOKE ALL ON public.telegram_imports FROM anon, authenticated;
GRANT ALL ON public.telegram_imports TO service_role;
ALTER TABLE public.telegram_imports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.telegram_upsert_car(
  p_group_key text, p_chat_id bigint, p_message_id bigint, p_version bigint, p_car jsonb
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

  IF FOUND AND p_version < v_post.text_version THEN
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
    INSERT INTO public.telegram_posts (group_key, chat_id, caption_message_id, car_id, text_version)
    VALUES (p_group_key, p_chat_id, p_message_id, v_car, p_version);
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
  SET text_version = p_version, caption_message_id = p_message_id, updated_at = now()
  WHERE group_key = p_group_key;
  RETURN QUERY SELECT v_post.car_id, 'updated'::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.telegram_sync_photos(p_group_key text, p_limit int DEFAULT 20)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_car uuid;
  v_added integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('telegram:' || p_group_key));
  SELECT car_id INTO v_car FROM public.telegram_posts WHERE group_key = p_group_key;
  IF v_car IS NULL THEN RETURN 0; END IF;

  INSERT INTO public.car_photos (car_id, url, sort_order, is_cover)
  SELECT v_car, m.storage_path, m.message_id::int, false
  FROM (
    SELECT * FROM public.telegram_post_messages
    WHERE group_key = p_group_key AND storage_path IS NOT NULL
    ORDER BY message_id LIMIT p_limit
  ) m
  WHERE NOT EXISTS (SELECT 1 FROM public.car_photos p WHERE p.car_id = v_car AND p.url = m.storage_path);
  GET DIAGNOSTICS v_added = ROW_COUNT;

  UPDATE public.car_photos p
  SET is_cover = (p.id = (SELECT c.id FROM public.car_photos c WHERE c.car_id = v_car ORDER BY c.sort_order, c.created_at LIMIT 1))
  WHERE p.car_id = v_car;
  RETURN v_added;
END;
$$;

REVOKE ALL ON FUNCTION public.telegram_upsert_car(text, bigint, bigint, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.telegram_sync_photos(text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_upsert_car(text, bigint, bigint, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.telegram_sync_photos(text, int) TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cars') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cars;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'car_photos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.car_photos;
  END IF;
END $$;