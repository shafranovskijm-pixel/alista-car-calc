
-- =============== Услуги (справочник) ===============
CREATE TABLE public.services_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'шт',
  base_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services_catalog TO authenticated;
GRANT ALL ON public.services_catalog TO service_role;
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view services" ON public.services_catalog FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Staff insert services" ON public.services_catalog FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Staff update services" ON public.services_catalog FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete services" ON public.services_catalog FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER update_services_catalog_updated_at BEFORE UPDATE ON public.services_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== КП (заголовок) ===============
CREATE SEQUENCE IF NOT EXISTS public.offers_number_seq START 1001;

CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER NOT NULL DEFAULT nextval('public.offers_number_seq'),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Коммерческое предложение',
  intro TEXT,
  template TEXT NOT NULL DEFAULT 'premium_dark',
  currency TEXT NOT NULL DEFAULT 'RUB',
  vat_included BOOLEAN NOT NULL DEFAULT false,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 20,
  valid_days INTEGER NOT NULL DEFAULT 14,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view offers" ON public.offers FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Staff insert offers" ON public.offers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Staff update offers" ON public.offers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete offers" ON public.offers FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX offers_client_idx ON public.offers(client_id);
CREATE INDEX offers_deal_idx ON public.offers(deal_id);
CREATE INDEX offers_status_idx ON public.offers(status);

-- =============== Позиции КП ===============
CREATE TABLE public.offer_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'шт',
  qty NUMERIC(14,3) NOT NULL DEFAULT 1,
  price NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_items TO authenticated;
GRANT ALL ON public.offer_items TO service_role;
ALTER TABLE public.offer_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view offer items" ON public.offer_items FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Staff manage offer items insert" ON public.offer_items FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Staff manage offer items update" ON public.offer_items FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Staff manage offer items delete" ON public.offer_items FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'admin'));

CREATE TRIGGER update_offer_items_updated_at BEFORE UPDATE ON public.offer_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX offer_items_offer_idx ON public.offer_items(offer_id);

-- =============== Сид справочника услуг ===============
INSERT INTO public.services_catalog (name, description, unit, base_price, category, sort_order) VALUES
('Растаможка легкового авто (физлицо)', 'Полное таможенное оформление легкового автомобиля для физического лица', 'шт', 25000, 'customs', 10),
('Растаможка коммерческого авто', 'Оформление коммерческого транспорта, включая подготовку документов', 'шт', 45000, 'customs', 20),
('Подача декларации на товары (ДТ)', 'Составление и подача электронной декларации в таможню', 'шт', 8000, 'customs', 30),
('Услуги брокера', 'Сопровождение сделки таможенным представителем', 'шт', 15000, 'customs', 40),
('Хранение на СВХ', 'Ответственное хранение на складе временного хранения', 'сут', 800, 'customs', 50),
('Оформление ЭПТС', 'Электронный паспорт транспортного средства', 'шт', 6000, 'customs', 60),
('Валютный контроль / оплата инвойса', 'Помощь в проведении платежа зарубежному контрагенту', 'шт', 5000, 'customs', 70),

('Сертификат СБКТС', 'Свидетельство о безопасности конструкции ТС', 'шт', 18000, 'lab', 10),
('Установка ГЛОНАСС/ЭРА', 'Установка и активация системы экстренного реагирования', 'шт', 30000, 'lab', 20),
('Лабораторные испытания образцов', 'Испытания и оформление протоколов для сертификации', 'шт', 22000, 'lab', 30),
('Экологический сертификат', 'Оформление документа о соответствии эконормам', 'шт', 12000, 'lab', 40),

('Доставка авто из Японии', 'Морская перевозка автомобиля из Японии до Владивостока', 'шт', 90000, 'logistics', 10),
('Доставка авто из Кореи', 'Морская перевозка автомобиля из Кореи до Владивостока', 'шт', 75000, 'logistics', 20),
('Доставка авто из Китая', 'Автомобильная перевозка из Китая до Владивостока', 'шт', 85000, 'logistics', 30),
('Ж/д доставка Владивосток → регион', 'Отправка автомобиля железнодорожным транспортом', 'шт', 120000, 'logistics', 40),
('Автовоз до региона', 'Доставка автомобиля автовозом до города клиента', 'шт', 45000, 'logistics', 50),
('Страхование груза', 'Страхование автомобиля на время транспортировки', 'шт', 8000, 'logistics', 60),

('Перевод документов', 'Заверенный перевод инвойса, ПТС и сопроводительных документов', 'стр', 700, 'extra', 10),
('Осмотр авто перед покупкой', 'Проверка автомобиля инспектором на аукционе / у продавца', 'шт', 15000, 'extra', 20),
('Юридическое сопровождение сделки', 'Проверка договора и участие юриста в сделке', 'шт', 20000, 'extra', 30);
