export const SITE_URL = "https://alistaru.ru";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export type SeoConfig = {
  title: string;
  description: string;
  canonicalPath: string | null;
  robots?: string;
  image?: string;
};

const indexable = (
  title: string,
  description: string,
  canonicalPath: string,
): SeoConfig => ({
  title,
  description,
  canonicalPath,
  robots: "index, follow",
});

const catalogPage = (
  title: string,
  description: string,
  canonicalPath: string,
): SeoConfig => ({
  title,
  description,
  canonicalPath,
  robots: "noindex, follow",
});

export const SEO_BY_PATH: Readonly<Record<string, SeoConfig>> = {
  "/": indexable(
    "ALISTA — таможенное оформление авто во Владивостоке",
    "Таможенное оформление автомобилей и другой техники во Владивостоке. Проверка документов и предварительный расчёт платежей специалистом ALISTA.",
    "/",
  ),
  "/services": indexable(
    "Услуги таможенного оформления во Владивостоке | ALISTA",
    "Таможенное оформление легковых и грузовых автомобилей, мототехники, спецтехники и водного транспорта во Владивостоке.",
    "/services",
  ),
  "/works": indexable(
    "Наши работы — опубликованные автомобили | ALISTA",
    "Опубликованные карточки автомобилей ALISTA: фотографии, цены, комплектации и страна происхождения.",
    "/works",
  ),
  "/cars": catalogPage(
    "Автомобили из Японии, Кореи и Китая | ALISTA",
    "Каталог автомобилей из Японии, Кореи и Китая: фотографии, характеристики, статус и цена. Запрос уточнённого расчёта в ALISTA.",
    "/cars",
  ),
  "/cars/japan": catalogPage(
    "Автомобили из Японии | ALISTA",
    "Каталог автомобилей из Японии: фотографии, характеристики, статус и цена. Запрос расчёта таможенного оформления во Владивостоке.",
    "/cars/japan",
  ),
  "/cars/korea": catalogPage(
    "Автомобили из Кореи | ALISTA",
    "Каталог автомобилей из Кореи: фотографии, характеристики, статус и цена. Запрос расчёта таможенного оформления во Владивостоке.",
    "/cars/korea",
  ),
  "/cars/china": catalogPage(
    "Автомобили из Китая | ALISTA",
    "Каталог автомобилей из Китая: фотографии, характеристики, статус и цена. Запрос расчёта таможенного оформления во Владивостоке.",
    "/cars/china",
  ),
  "/about": indexable(
    "О компании | ALISTA",
    "ООО «Алиста»: реквизиты, адрес и сведения о компании по таможенному оформлению автомобилей и спецтехники во Владивостоке.",
    "/about",
  ),
  "/contacts": indexable(
    "Контакты и заявка на расчёт | ALISTA",
    "Телефон, WhatsApp, Telegram, адрес и форма заявки ООО «Алиста» во Владивостоке.",
    "/contacts",
  ),
  "/privacy": {
    title: "Политика обработки персональных данных | ALISTA",
    description: "Политика обработки персональных данных посетителей сайта ООО «Алиста».",
    canonicalPath: "/privacy",
    robots: "noindex, follow",
  },
};

const noindex = (title: string, description: string): SeoConfig => ({
  title,
  description,
  canonicalPath: null,
  robots: "noindex, nofollow",
});

export const getRouteSeo = (pathname: string): SeoConfig => {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const exactMatch = SEO_BY_PATH[normalizedPath];

  if (exactMatch) return exactMatch;
  if (normalizedPath === "/admin" || normalizedPath.startsWith("/admin/")) {
    return noindex("CRM ALISTA", "Внутренняя система ALISTA.");
  }
  if (normalizedPath === "/calculator") {
    return noindex("Расчёт стоимости | ALISTA", "Переход к заявке на уточнённый расчёт.");
  }
  if (/^\/cars\/[^/]+$/.test(normalizedPath)) {
    return noindex(
      "Автомобиль | ALISTA",
      "Карточка автомобиля ALISTA загружается.",
    );
  }

  return noindex("Страница не найдена | ALISTA", "Запрошенная страница не найдена.");
};

export const toCanonicalUrl = (canonicalPath: string): string =>
  new URL(canonicalPath, SITE_URL).toString();
