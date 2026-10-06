import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/20261005170000_add_toyota_chr_auction_examples.sql"),
  "utf8",
);
const normalizedMigration = migration.replace(/\s+/g, " ");
const cataloguePayload = normalizedMigration.split("INSERT INTO public.cars")[0];

const expectedEntries = [
  {
    id: "6acd887d-255c-4d53-ac11-c246ab895ffb",
    slug: "toyota-c-hr-st-led-package-4wd-2019-1616000-jpy",
    model: "C-HR S-T LED Package 4WD",
    year: "2019",
    mileage: "98000",
    price: "1450000",
    auction: "TAA Kantou, лот 20184, за 1 616 000 йен",
    image: "/catalog/toyota-c-hr/toyota-c-hr-st-led-4wd-2019-1616000jpy.jpeg",
    sha256: "DE5D3A7D8A4D269837C99771BC19091871A96005AB2A0E366867B65E7A6E2CD8",
  },
  {
    id: "b15a9a05-5232-4838-9bd9-fb00d0ce2281",
    slug: "toyota-c-hr-g-t-4wd-2019-1883000-jpy",
    model: "C-HR G-T 4WD",
    year: "2019",
    mileage: "42000",
    price: "1600000",
    auction: "TAA Yokohama, лот 52032, за 1 883 000 йен",
    image: "/catalog/toyota-c-hr/toyota-c-hr-gt-4wd-2019-1883000jpy.jpeg",
    sha256: "1B32FC8BD8C7FA8D82EF7304095B5F6554B43EC9B389F6B715DFFEFC9B81EBD8",
  },
  {
    id: "82aa7891-7907-4bd8-b368-09c02915d236",
    slug: "toyota-c-hr-g-t-2020-1945000-jpy",
    model: "C-HR G-T",
    year: "2020",
    mileage: "79000",
    price: "1634000",
    auction: "TAA Hiroshima, лот 2146, за 1 945 000 йен",
    image: "/catalog/toyota-c-hr/toyota-c-hr-gt-2020-1945000jpy.jpeg",
    sha256: "D469B4EED1DE892E5CD68D4BD8F7D95FE929876DA2000D345DE1F9F12603C349",
  },
  {
    id: "c8e3cf45-e83c-4880-9db8-6578ed451c22",
    slug: "toyota-c-hr-s-t-4wd-2021-1649000-jpy",
    model: "C-HR S-T 4WD",
    year: "2021",
    mileage: "67000",
    price: "1468000",
    auction: "TAA Hiroshima, лот 2033, за 1 649 000 йен",
    image: "/catalog/toyota-c-hr/toyota-c-hr-st-4wd-2021-1649000jpy.jpeg",
    sha256: "AA91E42E4FDF8761C80785716C4BFD557A3FCC0E866F1D6E88B81A2D8AC22CF1",
  },
  {
    id: "75aa51b2-b210-4655-ab03-4ccd3b149a88",
    slug: "toyota-c-hr-s-t-led-package-2019-1706000-jpy",
    model: "C-HR S-T LED Package",
    year: "2019",
    mileage: "80000",
    price: "1500000",
    auction: "CAA Tokyo, лот 30280, за 1 706 000 йен",
    image: "/catalog/toyota-c-hr/toyota-c-hr-st-led-2019-1706000jpy.jpeg",
    sha256: "41DFBFD8D615E40F3E24F075AA0876C3EFB000EBEAA1D1BA4547C6EA719335AE",
  },
];

describe("Toyota C-HR auction catalogue data", () => {
  it.each(expectedEntries)("keeps the structured tuple for $slug intact", (entry, index: number) => {
    const start = cataloguePayload.lastIndexOf(`'${entry.id}'::uuid`);
    const nextEntry = expectedEntries[index + 1];
    const end = nextEntry
      ? cataloguePayload.lastIndexOf(`'${nextEntry.id}'::uuid`)
      : cataloguePayload.length;
    const tuple = cataloguePayload.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(tuple).toContain(`'${entry.slug}'`);
    expect(tuple).toContain(`'${entry.model}'`);
    expect(tuple).toMatch(new RegExp(`\\b${entry.year}\\b`));
    expect(tuple).toMatch(new RegExp(`\\b${entry.mileage}\\b`));
    expect(tuple).toMatch(new RegExp(`\\b${entry.price}\\b`));
    expect(tuple).toContain(entry.auction);
    expect(tuple).toContain(`'${entry.image}'`);
    expect(tuple).toContain("NULL::public.car_transmission");
    expect(tuple).toContain("'japan'::public.car_country");
    expect(tuple).toContain("'sold'::public.car_status");
  });

  it.each(expectedEntries)("ships the exact supplied image for $slug", (entry) => {
    const publicPath = resolve("public", entry.image.slice(1));
    const hash = createHash("sha256").update(readFileSync(publicPath)).digest("hex").toUpperCase();

    expect(hash).toBe(entry.sha256);
  });

  it("publishes exactly five sold Toyota C-HR examples", () => {
    const firstPayload = migration.split("INSERT INTO public.cars")[0];

    expect(firstPayload.match(/'sold'::public\.car_status/g)).toHaveLength(5);
    expect(firstPayload.match(/'japan'::public\.car_country/g)).toHaveLength(5);
  });

  it("keeps exact reruns deterministic and rejects foreign slug collisions", () => {
    expect(migration).toContain("Refusing to overwrite an existing car with slug");
    expect(migration).toContain("WHERE car.id <> expected.id");
    expect(migration).toContain("USING ERRCODE = '23505'");
    expect(migration).toContain("ON CONFLICT (id) DO UPDATE");
    expect(migration).not.toContain("ON CONFLICT (slug)");
    expect(migration).toContain("WHERE NOT EXISTS");
  });
});
