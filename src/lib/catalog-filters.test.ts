import { describe, expect, it } from "vitest";
import type { CarWithPhotos } from "./cars";
import { EMPTY_CATALOG_FILTERS, filterCatalogCars, readCatalogFilters, writeCatalogFilters, type CatalogFilters } from "./catalog-filters";

const car = (patch: Partial<CarWithPhotos> = {}): CarWithPhotos => ({
  id: "one", slug: "toyota-c-hr", title: "Toyota C-HR S-T 4WD", brand: "Toyota", model: "C-HR", year: 2020,
  engine_volume: 1.2, power_hp: 116, transmission: "cvt", fuel: "petrol", mileage_km: 79000,
  price: 1634000, currency: "RUB", country: "japan", status: "sold", description: "Полный привод, аукционная оценка 4",
  auction_sheet_url: null, video_url: null, sort_order: 10, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", photos: [], ...patch,
});
const filter = (patch: Partial<CatalogFilters> = {}) => ({ ...EMPTY_CATALOG_FILTERS, ...patch });

describe("public catalogue search and filters", () => {
  it.each(["Toyota C-HR", "toyota chr", "Тойота c hr", "c–hr", "CHR", "полный привод", "2020"])("finds the car by %s", (q) => {
    expect(filterCatalogCars([car()], filter({ q }))).toHaveLength(1);
  });
  it("does not include drafts or unrelated cars regardless of creation source", () => {
    expect(filterCatalogCars([car(), car({ id: "draft", status: "draft" }), car({ id: "other", brand: "Honda", model: "Fit", title: "Honda Fit", description: null })], filter({ q: "Тойота" })).map((row) => row.id)).toEqual(["one"]);
  });
  it("combines status, country, brand, model, fuel and transmission", () => {
    const cars = [car(), car({ id: "two", country: "china" }), car({ id: "three", status: "on_order" }), car({ id: "four", fuel: "hybrid" })];
    expect(filterCatalogCars(cars, filter({ country: "japan", status: "sold", brand: "Toyota", model: "C-HR", fuel: "petrol", transmission: "cvt" })).map((row) => row.id)).toEqual(["one"]);
  });
  it("excludes unknown year when either year bound is active", () => {
    expect(filterCatalogCars([car(), car({ id: "unknown", year: null })], filter({ yearTo: "2021" })).map((row) => row.id)).toEqual(["one"]);
    expect(filterCatalogCars([car(), car({ id: "unknown", year: null })], filter({ yearFrom: "2019" })).map((row) => row.id)).toEqual(["one"]);
  });
  it("excludes unknown and non-RUB prices when a rouble price range is active", () => {
    expect(filterCatalogCars([car(), car({ id: "unknown", price: null }), car({ id: "yen", currency: "JPY", price: 1500000 })], filter({ priceMin: "1000000", priceMax: "1800000" })).map((row) => row.id)).toEqual(["one"]);
  });
  it("returns no results for an inverted range", () => {
    expect(filterCatalogCars([car()], filter({ yearFrom: "2024", yearTo: "2018" }))).toEqual([]);
  });
  it("sorts known rouble prices first, keeping incomparable amounts last", () => {
    const cars = [car({ id: "unknown", price: null }), car(), car({ id: "cheap", price: 1000000 }), car({ id: "yen", currency: "JPY", price: 100 })];
    expect(filterCatalogCars(cars, filter({ sort: "price_asc" })).map((row) => row.id)).toEqual(["cheap", "one", "unknown", "yen"]);
    expect(filterCatalogCars(cars, filter({ sort: "price_desc" })).map((row) => row.id)).toEqual(["one", "cheap", "unknown", "yen"]);
  });
  it("sorts newest CRM additions and year, keeping unknown years last", () => {
    const cars = [car(), car({ id: "new", year: 2022, created_at: "2026-10-12T00:00:00Z" }), car({ id: "unknown", year: null })];
    expect(filterCatalogCars(cars, filter({ sort: "newest" }))[0].id).toBe("new");
    expect(filterCatalogCars(cars, filter({ sort: "year_desc" })).map((row) => row.id)).toEqual(["new", "one", "unknown"]);
  });
  it("round trips shareable filters and rejects unknown sorting", () => {
    const filters = filter({ q: "Тойота CHR", brand: "Toyota", priceMin: "1400000", status: "sold", sort: "price_asc" });
    expect(readCatalogFilters(writeCatalogFilters(filters))).toEqual(filters);
    expect(readCatalogFilters(new URLSearchParams("sort=bogus")).sort).toBe("catalog");
    expect(writeCatalogFilters(filter()).toString()).toBe("");
  });
  it("sanitizes unrecognized enum values and invalid numeric URL bounds", () => {
    const filters = readCatalogFilters(new URLSearchParams("country=mars&status=draft&fuel=water&transmission=invalid&yearFrom=-1&yearTo=2020.5&priceMin=NaN&priceMax=99999999999999999999"));
    expect(filters).toEqual(EMPTY_CATALOG_FILTERS);
    expect(readCatalogFilters(new URLSearchParams("priceMin=1400000&yearFrom=2019")).priceMin).toBe("1400000");
  });
});
