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
  // Without #авто the post is read as a normal channel post (free-form).
  if (!tags.has(IMPORT_TAG)) return source ? parseFreeFormPost(source, now) : { kind: "ignored" };

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

// ---------------------------------------------------------------------------
// Free-form posts (how the channel is written today). Only explicit facts are
// taken; anything missing or contradictory makes the post "invalid" with reasons.

const BRANDS: [string, RegExp][] = [
  ["Toyota", /toyota|тойота/i], ["Lexus", /lexus|лексус/i], ["Honda", /honda|хонда/i], ["Nissan", /nissan|ниссан/i],
  ["Mazda", /mazda|мазда/i], ["Subaru", /subaru|субару/i], ["Suzuki", /suzuki|сузуки/i], ["Mitsubishi", /mitsubishi|мицубиси/i],
  ["Daihatsu", /daihatsu|дайхатсу/i], ["Infiniti", /infiniti/i], ["Hyundai", /hyundai|хендай|хундай/i], ["Kia", /\bkia\b|(?<![а-яё])киа(?![а-яё])/i],
  ["Genesis", /genesis/i], ["SsangYong", /ssang\s?yong/i], ["Chevrolet", /chevrolet/i], ["Renault", /renault/i],
  ["Peugeot", /peugeot|пежо/i], ["Citroen", /citro[eë]n/i], ["BMW", /\bbmw\b|(?<![а-яё])бмв(?![а-яё])/i], ["Mercedes-Benz", /mercedes|мерседес/i],
  ["Audi", /\baudi\b|\bауди\b/i], ["Volkswagen", /volkswagen|\bvw\b/i], ["Porsche", /porsche/i], ["Volvo", /volvo/i],
  ["Land Rover", /land\s?rover/i], ["Ford", /\bford\b/i], ["Tesla", /tesla/i], ["Skoda", /skoda/i], ["MINI", /\bmini\b/i],
  ["BYD", /\bbyd\b/i], ["Geely", /geely|джили/i], ["Chery", /\bchery\b|чери/i], ["Haval", /haval|хавал/i], ["Changan", /changan/i],
  ["Exeed", /exeed/i], ["Tank", /\btank\b/i], ["Li Auto", /li\s?auto|lixiang|li\s?xiang/i], ["Zeekr", /zeekr/i], ["Jetour", /jetour/i],
  ["Omoda", /omoda/i], ["Voyah", /voyah/i], ["Hongqi", /hongqi/i], ["Great Wall", /great\s?wall/i], ["Jeep", /\bjeep\b/i],
];

const AMOUNT_RE = /(\d{1,3}(?:[ .\u00a0\u202f]\d{3})+|\d+)(?:,(\d+))?\s*(млн\.?|миллион\w*|тыс\.?|тысяч\w*)?\s*(₽|руб\w*\.?|RUB|JPY|[ий]ен\w*|CNY|RMB|юан\w*)/giu;
const CUR_OF = (s: string): ParsedCar["currency"] =>
  /₽|руб|rub/i.test(s) ? "RUB" : /jpy|[ий]ен/i.test(s) ? "JPY" : "CNY";

const stripDecor = (s: string) =>
  s.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\u200d\ufe0f]/gu, " ").replace(/\s+/g, " ").trim();

export const detectBrands = (text: string) => BRANDS.filter(([, re]) => re.test(text)).map(([b]) => b);

export const parseFreeFormPost = (text: string, now = new Date()): ParseResult => {
  const source = text.trim();
  const tags = extractTags(source);
  const lines = source.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const brands = detectBrands(source);
  const amounts = [...source.matchAll(AMOUNT_RE)];

  if (!brands.length && !amounts.length) return { kind: "ignored" };

  const numbered = source.match(/(^|\n)\s*\d{1,2}\s*[).]\s+\S/g)?.length ?? 0;
  if (/подборк/i.test(source) || numbered >= 2 || brands.length >= 2) {
    return { kind: "invalid", errors: ["Похоже на подборку нескольких машин — пропущено, одна публикация должна описывать одну машину"] };
  }

  const errors: string[] = [];

  // Brand and model from the first line naming the brand.
  let brand = "", model = "", title = "";
  if (!brands.length) errors.push("Не найдена марка автомобиля");
  else {
    brand = brands[0];
    const re = BRANDS.find(([b]) => b === brand)![1];
    const line = lines.find((l) => re.test(l))!;
    const clean = stripDecor(line);
    title = clean.slice(0, 120);
    const after = clean.slice((clean.match(re)?.index ?? 0) + (clean.match(re)?.[0].length ?? 0)).trim();
    const words: string[] = [];
    for (const w of after.split(" ")) {
      if (!w || /^[-–—:,(]/.test(w) || /^(19|20)\d{2}/.test(w) || /^\d[.,]\d/.test(w) || /^(цена|стоимость|под|из|в|с)$/i.test(w)) break;
      words.push(w.replace(/[,.]$/, ""));
      if (words.length >= 3) break;
    }
    model = words.join(" ");
    if (!model) errors.push("Не найдена модель рядом с маркой");
  }

  // Year: explicit "2021г", "Год: 2020", "Дата производства: 09.2022", or a bare year on the title line.
  const years = new Set<number>();
  for (const m of source.matchAll(/(?<!\d)((?:19|20)\d{2})\s*г(?:\.|од|(?![а-яё]))/giu)) years.add(Number(m[1]));
  for (const m of source.matchAll(/(?:год(?:\s*выпуска)?|дата\s*производства|выпуск)[^\d\n]{0,15}(?:\d{1,2}[./])?((?:19|20)\d{2})/giu)) years.add(Number(m[1]));
  if (title) for (const m of title.matchAll(/(?:^|\s)((?:19|20)\d{2})(?=\s|$)/g)) years.add(Number(m[1]));
  const validYears = [...years].filter((y) => y >= 1950 && y <= now.getFullYear() + 1);
  if (!validYears.length) errors.push("Не указан год выпуска");
  else if (validYears.length > 1) errors.push(`Указано несколько годов: ${validYears.join(", ")}`);

  // Country from flags or explicit words.
  const countries = new Set<ParsedCar["country"]>();
  if (/🇯🇵|япони/i.test(source)) countries.add("japan");
  if (/🇰🇷|коре/i.test(source)) countries.add("korea");
  if (/🇨🇳|кита/i.test(source)) countries.add("china");
  if (!countries.size) errors.push("Не указана страна (Япония/Корея/Китай)");
  else if (countries.size > 1) errors.push("Указано несколько стран");

  // Price: exactly one distinct amount with an explicit currency.
  const prices = new Map<string, { price: number; currency: ParsedCar["currency"] }>();
  let negative = false;
  for (const m of amounts) {
    const before = source.slice(0, m.index);
    if (/(^|\s)[-−]\s?$/.test(before)) negative = true;
    let v = Number(m[1].replace(/[ .\u00a0\u202f]/g, "") + (m[2] ? `.${m[2]}` : ""));
    if (m[3]) v *= /млн|миллион/i.test(m[3]) ? 1_000_000 : 1_000;
    const cur = CUR_OF(m[4]);
    prices.set(`${v}${cur}`, { price: Math.round(v), currency: cur });
  }
  if (/¥/.test(source)) errors.push("Знак ¥ неоднозначен — нужна валюта JPY/иены или CNY/юани");
  if (negative) errors.push("Цена не может быть отрицательной");
  if (!prices.size) errors.push("Не указана цена с валютой (₽/RUB, JPY, CNY)");
  else if (prices.size > 1) errors.push("В посте несколько разных цен — непонятно, какая итоговая");
  const priced = [...prices.values()][0];
  if (priced && priced.price <= 0) errors.push("Цена должна быть больше нуля");

  if (errors.length) return { kind: "invalid", errors };

  const mileage = source.match(/пробег[^\d\n]{0,12}(\d{1,3}(?:[ .\u00a0\u202f]\d{3})+|\d+)\s*(тыс\.?)?\s*км/iu);
  const engineLine = lines.find((l) => /мотор|двигат|объ[её]м/i.test(l)) ?? "";
  const engineM = engineLine.match(/(\d[.,]\d)\s*(?:l|л|t|т)?(?![\d])/i) ?? engineLine.match(/(\d{3,4})\s*(?:см|cc|куб)/i);
  let engine = engineM ? Number(engineM[1].replace(",", ".")) : null;
  if (engine !== null && engine >= 100) engine = Math.round(engine / 100) / 10;
  const power = source.match(/(\d{2,4})\s*(?:л\.?\s*с\.?|hp\b|лс\b)/i);
  const fuelScope = [engineLine, ...lines.filter((l) => /топлив/i.test(l))].join(" ");
  const fuels = FUELS.filter(([re]) => re.test(fuelScope)).map(([, f]) => f);
  const trLine = lines.filter((l) => /трансмисс|коробк|кпп|вариатор|cvt|акпп|мкпп|робот|dct/i.test(l)).join(" ");
  const trans = TRANSMISSIONS.filter(([re]) => re.test(trLine)).map(([, t]) => t);

  let status: ParsedCar["status"] = "on_order";
  if (/в\s*наличии/i.test(source)) status = "in_stock";
  else if (/в\s*пути/i.test(source)) status = "in_transit";
  if (/(?<![а-яё])продан[аo]?(?![а-яё])/i.test(source) || tags.has(SOLD_TAG)) status = "sold";
  if (tags.has(HIDE_TAG)) status = "draft";

  const mileageVal = mileage ? Number(mileage[1].replace(/[ .\u00a0\u202f]/g, "")) * (mileage[2] ? 1000 : 1) : null;
  return {
    kind: "ok",
    car: {
      brand, model, year: validYears[0], country: [...countries][0], price: priced.price, currency: priced.currency, status,
      mileage_km: mileageVal, engine_volume: engine, power_hp: power ? Number(power[1]) : null,
      transmission: new Set(trans).size === 1 ? trans[0] : null,
      fuel: new Set(fuels).size === 1 ? fuels[0] : null,
      title: title || `${brand} ${model} ${validYears[0]}`,
      description: source,
    },
  };
};
