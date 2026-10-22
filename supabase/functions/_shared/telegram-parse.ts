// Pure parser for #авто channel posts. No Deno/Node APIs so the web tests can import it.

export const IMPORT_TAG = "авто";
export const SOLD_TAG = "продано";
export const HIDE_TAG = "скрыть";

export type ParsedCar = {
  brand: string;
  model: string;
  year: number;
  country: "japan" | "korea" | "china";
  price: number;
  currency: "RUB" | "JPY" | "CNY";
  status: "in_stock" | "in_transit" | "on_order" | "sold" | "draft";
  mileage_km: number | null;
  engine_volume: number | null;
  power_hp: number | null;
  transmission: "at" | "mt" | "cvt" | "amt" | "dct" | "other" | null;
  fuel: "petrol" | "diesel" | "hybrid" | "electric" | "gas" | null;
  title: string;
  description: string;
};

export type ParseResult =
  | { kind: "ignored" }
  | { kind: "invalid"; errors: string[] }
  | { kind: "ok"; car: ParsedCar };

export const extractTags = (text: string): Set<string> => {
  const tags = new Set<string>();
  for (const m of text.matchAll(/#([\p{L}\p{N}_]+)/gu)) tags.add(m[1].toLowerCase());
  return tags;
};

const FIELD_ALIASES: Record<string, string> = {
  "марка": "brand", "модель": "model", "год": "year", "страна": "country", "цена": "price",
  "пробег": "mileage", "двигатель": "engine", "объём": "engine", "объем": "engine",
  "мощность": "power", "коробка": "transmission", "кпп": "transmission",
  "топливо": "fuel", "статус": "status",
};

const readFields = (text: string) => {
  const fields: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(/^[^\p{L}]*([\p{L}]+)\s*[:：]\s*(.+)$/u);
    if (!m) continue;
    const key = FIELD_ALIASES[m[1].toLowerCase()];
    if (key && !(key in fields)) fields[key] = m[2].trim();
  }
  return fields;
};

const num = (s: string) => {
  const cleaned = s.replace(/[\s\u00a0\u202f]/g, "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  return cleaned ? Number(cleaned[0]) : NaN;
};

const COUNTRIES: [RegExp, ParsedCar["country"]][] = [
  [/япон/i, "japan"], [/коре/i, "korea"], [/кита/i, "china"],
];
const STATUSES: [RegExp, ParsedCar["status"]][] = [
  [/под\s*заказ/i, "on_order"], [/в\s*наличии/i, "in_stock"], [/в\s*пути/i, "in_transit"], [/продан/i, "sold"],
];
const TRANSMISSIONS: [RegExp, NonNullable<ParsedCar["transmission"]>][] = [
  [/dct/i, "dct"], [/вариатор|cvt/i, "cvt"], [/робот|amt/i, "amt"], [/мкпп|механ|\bmt\b/i, "mt"], [/акпп|автомат|\bat\b/i, "at"],
];
const FUELS: [RegExp, NonNullable<ParsedCar["fuel"]>][] = [
  [/гибрид|hybrid/i, "hybrid"], [/дизел|diesel/i, "diesel"], [/электр|electric|ev\b/i, "electric"], [/бензин|petrol/i, "petrol"], [/газ/i, "gas"],
];
const pick = <T,>(value: string | undefined, table: [RegExp, T][]) =>
  value ? table.find(([re]) => re.test(value))?.[1] ?? null : null;

const CURRENCY_TOKENS: [RegExp, ParsedCar["currency"]][] = [
  [/\bRUB\b|руб(?:лей|ля|ль)?\.?|₽/giu, "RUB"],
  [/\bJPY\b|[ий]ен[аы]?/giu, "JPY"],
  [/\bCNY\b|\bRMB\b|юан(?:ей|я|ь|и)?/giu, "CNY"],
];
const MULTIPLIERS: [RegExp, number][] = [
  [/^(?:млн\.?|миллион(?:а|ов)?)$/iu, 1_000_000],
  [/^(?:тыс\.?|тысяч[аи]?)$/iu, 1_000],
];

/** Strict price parser: one positive amount, one unambiguous currency. */
export const parsePrice = (raw: string): { price: number; currency: ParsedCar["currency"] } | { error: string } => {
  let rest = raw.trim();
  const found = new Set<ParsedCar["currency"]>();
  for (const [re, cur] of CURRENCY_TOKENS) {
    if (rest.search(re) >= 0) found.add(cur);
    rest = rest.replace(re, " ");
  }
  const yen = rest.includes("¥");
  rest = rest.replace(/¥/g, " ");
  if (yen && found.size === 0) return { error: "знак ¥ неоднозначен — укажите JPY или CNY" };
  if (yen && found.size === 1 && found.has("RUB")) return { error: "в цене смешаны валюты" };
  if (found.size === 0) return { error: "не указана валюта (RUB/₽/JPY/CNY)" };
  if (found.size > 1) return { error: "в цене указано несколько валют" };
  if (/[-−–]/.test(rest)) return { error: "цена не может быть отрицательной или диапазоном" };
  const m = rest.trim().match(/^(\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)(?:[.,](\d+))?\s*([\p{L}.]+)?$/u);
  if (!m) return { error: "не удалось однозначно прочитать сумму" };
  let multiplier = 1;
  if (m[3]) {
    const mul = MULTIPLIERS.find(([re]) => re.test(m[3]));
    if (!mul) return { error: `непонятное слово в цене «${m[3]}»` };
    multiplier = mul[1];
  }
  const value = Number(`${m[1].replace(/[ \u00a0\u202f]/g, "")}${m[2] ? `.${m[2]}` : ""}`) * multiplier;
  if (!Number.isFinite(value) || value <= 0) return { error: "цена должна быть больше нуля" };
  return { price: Math.round(value * 100) / 100, currency: [...found][0] };
};

export const parseCarPost = (text: string | null | undefined, now = new Date()): ParseResult => {
  const source = (text ?? "").trim();
  const tags = extractTags(source);
  if (!tags.has(IMPORT_TAG)) return { kind: "ignored" };

  const f = readFields(source);
  const errors: string[] = [];
  if (!f.brand) errors.push("Не указана «Марка:»");
  if (!f.model) errors.push("Не указана «Модель:»");

  const year = f.year ? num(f.year) : NaN;
  if (!f.year) errors.push("Не указан «Год:»");
  else if (!Number.isInteger(year) || year < 1950 || year > now.getFullYear() + 1) errors.push(`Некорректный год: «${f.year}»`);

  const country = pick(f.country, COUNTRIES);
  if (!f.country) errors.push("Не указана «Страна:» (Япония/Корея/Китай)");
  else if (!country) errors.push(`Неизвестная страна: «${f.country}» — нужна Япония, Корея или Китай`);

  let price = NaN;
  let currency: ParsedCar["currency"] | null = null;
  if (!f.price) errors.push("Не указана «Цена:»");
  else {
    const p = parsePrice(f.price);
    if ("error" in p) errors.push(`Некорректная цена «${f.price}»: ${p.error}`);
    else ({ price, currency } = p);
  }

  let status: ParsedCar["status"] = "on_order";
  if (f.status) {
    const s = pick(f.status, STATUSES);
    if (!s) errors.push(`Неизвестный статус: «${f.status}» — нужен Под заказ/В наличии/В пути/Продан`);
    else status = s;
  }
  if (tags.has(SOLD_TAG)) status = "sold";
  if (tags.has(HIDE_TAG)) status = "draft";

  if (errors.length) return { kind: "invalid", errors };

  let engine: number | null = f.engine ? num(f.engine) : null;
  if (engine !== null && !Number.isFinite(engine)) engine = null;
  if (engine !== null && engine >= 100) engine = Math.round(engine / 100) / 10; // cc -> litres
  const mileage = f.mileage ? num(f.mileage) : NaN;
  const power = f.power ? num(f.power) : NaN;

  const brand = f.brand.slice(0, 60);
  const model = f.model.slice(0, 80);
  return {
    kind: "ok",
    car: {
      brand, model, year, country: country!, price, currency: currency!, status,
      mileage_km: Number.isFinite(mileage) ? Math.round(mileage) : null,
      engine_volume: engine,
      power_hp: Number.isFinite(power) ? Math.round(power) : null,
      transmission: pick(f.transmission, TRANSMISSIONS),
      fuel: pick(f.fuel, FUELS),
      title: `${brand} ${model} ${year}`,
      description: source,
    },
  };
};

export const telegramSlug = (car: Pick<ParsedCar, "brand" | "model" | "year">, chatId: number, messageId: number) => {
  const base = `${car.brand} ${car.model} ${car.year}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "car";
  return `${base}-tg${Math.abs(chatId) % 100000}-${messageId}`;
};

/** Removes any bot token that could appear inside an error text or URL. */
export const redactToken = (text: string) =>
  text.replace(/bot\d+:[A-Za-z0-9_-]+/g, "bot<hidden>").replace(/\d{6,}:[A-Za-z0-9_-]{20,}/g, "<hidden>");
