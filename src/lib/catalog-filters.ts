import type { CarWithPhotos } from "@/lib/cars";

export type CatalogSort = "catalog" | "newest" | "price_asc" | "price_desc" | "year_desc";
export type CatalogFilters = {
  q: string;
  country: string;
  status: string;
  brand: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  priceMin: string;
  priceMax: string;
  transmission: string;
  fuel: string;
  sort: CatalogSort;
};

export const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  q: "", country: "all", status: "all", brand: "all", model: "all",
  yearFrom: "", yearTo: "", priceMin: "", priceMax: "",
  transmission: "all", fuel: "all", sort: "catalog",
};

const BRAND_ALIASES: Record<string, string> = {
  тойота: "toyota", тоёта: "toyota", хонда: "honda", ниссан: "nissan",
  мазда: "mazda", субару: "subaru", сузуки: "suzuki", митсубиси: "mitsubishi",
  лексус: "lexus", хендай: "hyundai", хёндай: "hyundai", хундай: "hyundai",
  киа: "kia", фольксваген: "volkswagen", бмв: "bmw", мерседес: "mercedes",
};

export const normalizeCatalogText = (text: string) => text.toLocaleLowerCase("ru-RU")
  .replace(/ё/g, "е").replace(/[^\p{L}\p{N}]+/gu, " ").trim()
  .split(/\s+/).map((word) => BRAND_ALIASES[word] ?? word).join(" ");

const numericBound = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const matchesBounds = (value: number | null, from: string, to: string) => {
  const min = numericBound(from);
  const max = numericBound(to);
  if (min === undefined && max === undefined) return true;
  if (value == null || !Number.isFinite(value)) return false;
  return (min === undefined || value >= min) && (max === undefined || value <= max);
};

export const readCatalogFilters = (params: URLSearchParams): CatalogFilters => {
  const next = { ...EMPTY_CATALOG_FILTERS };
  for (const key of Object.keys(next) as (keyof CatalogFilters)[]) {
    const value = params.get(key);
    if (value && key !== "sort") next[key] = value.slice(0, 200);
  }
  const enumValues = {
    country: ["all", "japan", "korea", "china"],
    status: ["all", "in_stock", "in_transit", "on_order", "sold"],
    transmission: ["all", "at", "mt", "cvt", "amt", "dct", "other"],
    fuel: ["all", "petrol", "diesel", "hybrid", "electric", "gas"],
  };
  for (const key of Object.keys(enumValues) as (keyof typeof enumValues)[]) {
    if (!enumValues[key].includes(next[key])) next[key] = "all";
  }
  for (const key of ["yearFrom", "yearTo", "priceMin", "priceMax"] as const) {
    if (!/^\d+$/.test(next[key]) || !Number.isSafeInteger(Number(next[key])) || (key.startsWith("year") && Number(next[key]) > 9999)) next[key] = "";
  }
  const sort = params.get("sort");
  if (sort && ["catalog", "newest", "price_asc", "price_desc", "year_desc"].includes(sort)) next.sort = sort as CatalogSort;
  return next;
};

export const writeCatalogFilters = (filters: CatalogFilters) => {
  const params = new URLSearchParams();
  for (const key of Object.keys(filters) as (keyof CatalogFilters)[]) {
    if (filters[key] && filters[key] !== EMPTY_CATALOG_FILTERS[key]) params.set(key, filters[key]);
  }
  return params;
};

export const filterCatalogCars = (cars: CarWithPhotos[], filters: CatalogFilters): CarWithPhotos[] => {
  const query = normalizeCatalogText(filters.q);
  const terms = query.split(/\s+/).filter(Boolean);
  const priceFiltered = numericBound(filters.priceMin) !== undefined || numericBound(filters.priceMax) !== undefined;
  const filtered = cars.filter((car) => {
    if (car.status === "draft") return false;
    for (const field of ["country", "status", "brand", "model", "transmission", "fuel"] as const) {
      if (filters[field] !== "all" && car[field] !== filters[field]) return false;
    }
    if (!matchesBounds(car.year, filters.yearFrom, filters.yearTo)) return false;
    if (priceFiltered && (car.currency !== "RUB" || !matchesBounds(car.price, filters.priceMin, filters.priceMax))) return false;
    const searchable = normalizeCatalogText([car.brand, car.model, car.title, car.description ?? "", car.year ?? ""].join(" ")).replace(/\s/g, "");
    return terms.every((term) => searchable.includes(term));
  });
  const compareNullable = (a: number | null, b: number | null, descending = false) => {
    if (a == null) return b == null ? 0 : 1;
    if (b == null) return -1;
    return descending ? b - a : a - b;
  };
  return filtered.sort((a, b) => {
    if (filters.sort === "price_asc" || filters.sort === "price_desc") {
      // Do not compare unlike currencies as if they were roubles.
      return compareNullable(a.currency === "RUB" ? a.price : null, b.currency === "RUB" ? b.price : null, filters.sort === "price_desc");
    }
    if (filters.sort === "year_desc") return compareNullable(a.year, b.year, true);
    if (filters.sort === "newest") return b.created_at.localeCompare(a.created_at);
    return b.sort_order - a.sort_order || b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id);
  });
};
