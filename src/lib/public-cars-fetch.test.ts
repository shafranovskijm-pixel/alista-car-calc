import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CarWithPhotos } from "./cars";

const mocks = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[], offset: 0, end: 0,
  neq: vi.fn(), range: vi.fn(), eq: vi.fn(), signed: vi.fn(),
}));
vi.mock("@/integrations/supabase/proxy-client", () => ({
  supabase: {
    from: () => {
      const query = {
        select: () => query, order: () => query,
        neq: (...args: unknown[]) => { mocks.neq(...args); return query; },
        eq: (...args: unknown[]) => { mocks.eq(...args); return query; },
        range: (offset: number, end: number) => { mocks.offset = offset; mocks.end = end; mocks.range(offset, end); return query; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: mocks.rows.slice(mocks.offset, mocks.end + 1), error: null })),
      };
      return query;
    },
    storage: { from: () => ({ createSignedUrl: mocks.signed }) },
  },
}));
import { fetchPublicCars } from "./cars";

const row = (id: string, patch: Partial<CarWithPhotos> & { car_photos?: unknown[] } = {}) => ({
  id, slug: id, title: "Toyota C-HR", brand: "Toyota", model: "C-HR", year: 2020, status: "on_order",
  country: "japan", currency: "RUB", price: 1500000, sort_order: 1, created_at: "2026-10-01", car_photos: [], ...patch,
});

beforeEach(() => { vi.clearAllMocks(); mocks.rows = []; mocks.offset = 0; mocks.end = 0; });

describe("complete published catalogue fetching", () => {
  it("reads beyond 1000 rows with the draft guard on every page", async () => {
    mocks.rows = Array.from({ length: 1003 }, (_, index) => row(`car-${index}`));
    const cars = await fetchPublicCars("japan");
    expect(cars).toHaveLength(1003);
    expect(cars[1002].id).toBe("car-1002");
    expect(mocks.range.mock.calls).toEqual([[0, 499], [500, 999], [1000, 1499]]);
    expect(mocks.neq.mock.calls).toEqual(Array.from({ length: 3 }, () => ["status", "draft"]));
    expect(mocks.eq.mock.calls).toEqual(Array.from({ length: 3 }, () => ["country", "japan"]));
  });
  it("defensively hides drafts even in an authenticated read", async () => {
    mocks.rows = [row("visible"), row("draft", { status: "draft" })];
    expect((await fetchPublicCars()).map((car) => car.id)).toEqual(["visible"]);
  });
  it("keeps cars searchable if a single storage image cannot be signed", async () => {
    mocks.rows = [row("visible", { car_photos: [{ id: "bad", url: "missing.jpg", car_id: "visible", sort_order: 0, is_cover: true }, { id: "good", url: "/existing.jpg", car_id: "visible", sort_order: 1, is_cover: false }] })];
    mocks.signed.mockResolvedValue({ data: null, error: new Error("missing image") });
    const cars = await fetchPublicCars();
    expect(cars).toHaveLength(1);
    expect(cars[0].photos).toHaveLength(1);
    expect(cars[0].photos[0].url).toBe("/existing.jpg");
  });
});
