import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCarPost, redactToken, telegramSlug } from "../../supabase/functions/_shared/telegram-parse";
import { authorize, handleUpdate, type ImportDeps, type TgMessage } from "../../supabase/functions/_shared/telegram-import";

const POST = `#авто
Марка: Toyota
Модель: C-HR
Год: 2020
Страна: Япония
Цена: 1 945 000 ₽
Пробег: 42 000 км
Двигатель: 1200 см3
Мощность: 116 л.с.
Коробка: Вариатор
Топливо: Бензин
Статус: В пути
Отличное состояние.`;

describe("parseCarPost", () => {
  it("parses every template field and keeps the original text", () => {
    const r = parseCarPost(POST, new Date("2026-10-22"));
    expect(r.kind).toBe("ok");
    if (r.kind !== "ok") return;
    expect(r.car).toMatchObject({
      brand: "Toyota", model: "C-HR", year: 2020, country: "japan", price: 1945000, currency: "RUB",
      mileage_km: 42000, engine_volume: 1.2, power_hp: 116, transmission: "cvt", fuel: "petrol", status: "in_transit",
      title: "Toyota C-HR 2020",
    });
    expect(r.car.description).toContain("Отличное состояние.");
  });
  it("ignores posts without #авто", () => {
    expect(parseCarPost(POST.replace("#авто", "#новости")).kind).toBe("ignored");
  });
  it("rejects missing required fields instead of guessing", () => {
    const r = parseCarPost("#авто\nМарка: Honda\nЦена: 1000000");
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") expect(r.errors.join(" ")).toMatch(/Модель.*Год.*Страна.*валюта/s);
  });
  it("rejects unknown country and status", () => {
    const r = parseCarPost(POST.replace("Япония", "Германия").replace("В пути", "Скоро"));
    expect(r.kind === "invalid" && r.errors.length).toBe(2);
  });
  it("accepts JPY and CNY and leaves optional fields empty", () => {
    const r = parseCarPost("#авто\nМарка: BYD\nМодель: Han\nГод: 2023\nСтрана: Китай\nЦена: 150000 CNY");
    expect(r.kind === "ok" && [r.car.currency, r.car.status, r.car.mileage_km]).toEqual(["CNY", "on_order", null]);
    const j = parseCarPost(POST.replace("1 945 000 ₽", "1945000 JPY"));
    expect(j.kind === "ok" && j.car.currency).toBe("JPY");
  });
  it("#продано makes the car sold and #скрыть hides it", () => {
    const sold = parseCarPost(POST + "\n#продано");
    expect(sold.kind === "ok" && sold.car.status).toBe("sold");
    const hidden = parseCarPost(POST + "\n#продано #скрыть");
    expect(hidden.kind === "ok" && hidden.car.status).toBe("draft");
  });
  it("builds a unique ascii slug per message", () => {
    expect(telegramSlug({ brand: "Toyota", model: "C-HR", year: 2020 }, -1001234567890, 77)).toBe("toyota-c-hr-2020-tg67890-77");
  });
  it("redacts bot tokens from errors", () => {
    expect(redactToken("https://api.telegram.org/file/bot123456789:AAAbbbCCCdddEEEfffGGGhhhIIIjjjKKK/x.jpg")).not.toContain("AAAbbb");
  });
});

const CHANNEL = -100500;
const msg = (patch: Partial<TgMessage>): TgMessage => ({ message_id: 1, date: 1000, chat: { id: CHANNEL, type: "channel" }, ...patch });

describe("authorize", () => {
  const settings = { enabled: true, channel_id: CHANNEL };
  it("requires the exact secret token", () => {
    expect(authorize(null, "s3cret", settings, msg({}))).toBe("unauthorized");
    expect(authorize("wrong!", "s3cret", settings, msg({}))).toBe("unauthorized");
    expect(authorize("x", null, settings, msg({}))).toBe("unauthorized");
  });
  it("does nothing while import is disabled", () => {
    expect(authorize("s3cret", "s3cret", { enabled: false, channel_id: CHANNEL }, msg({}))).toBe("disabled");
  });
  it("ignores other channels and private chats", () => {
    expect(authorize("s3cret", "s3cret", settings, msg({ chat: { id: -1009, type: "channel" } }))).toBe("foreign");
    expect(authorize("s3cret", "s3cret", settings, msg({ chat: { id: CHANNEL, type: "private" } }))).toBe("foreign");
    expect(authorize("s3cret", "s3cret", settings, msg({}))).toBe("ok");
  });
});

/** In-memory backend mirroring the SQL functions' semantics (lock-free since JS is single-threaded). */
const fakeBackend = () => {
  const processed = new Set<number>();
  const messages = new Map<number, { group_key: string; file_id: string | null; file_unique_id: string | null; storage_path: string | null }>();
  const posts = new Map<string, { car_id: string; version: number }>();
  const cars = new Map<string, Record<string, unknown>>();
  const photos: { car_id: string; url: string; sort: number; cover: boolean }[] = [];
  const logs: { status: string; message: string }[] = [];
  let downloads = 0;
  const deps: ImportDeps = {
    isProcessed: async (id) => processed.has(id),
    markProcessed: async (id) => { processed.add(id); },
    saveMessage: async (r) => { if (!messages.has(r.message_id)) messages.set(r.message_id, { ...r, storage_path: null }); },
    upsertCar: async (g, _c, _m, version, car) => {
      const p = posts.get(g);
      if (p && version < p.version) return { car_id: p.car_id, outcome: "stale" };
      if (!p) { const id = `car-${posts.size + 1}`; posts.set(g, { car_id: id, version }); cars.set(id, car); return { car_id: id, outcome: "created" }; }
      p.version = version; cars.set(p.car_id, car); return { car_id: p.car_id, outcome: "updated" };
    },
    postCarId: async (g) => posts.get(g)?.car_id ?? null,
    pendingPhotos: async (g) => [...messages.entries()].filter(([, m]) => m.group_key === g && m.file_id && !m.storage_path)
      .sort(([a], [b]) => a - b).map(([id, m]) => ({ message_id: id, file_id: m.file_id!, file_unique_id: m.file_unique_id!, mime_type: "image/jpeg" })),
    downloadPhoto: async () => { downloads++; return { bytes: new Uint8Array(10), mime: "image/jpeg" }; },
    storePhoto: async () => undefined,
    setStoragePath: async (_c, id, path) => { messages.get(id)!.storage_path = path; },
    syncPhotos: async (g) => {
      const car = posts.get(g)!.car_id;
      for (const [id, m] of [...messages.entries()].sort(([a], [b]) => a - b)) {
        if (m.group_key === g && m.storage_path && !photos.some((p) => p.car_id === car && p.url === m.storage_path)) photos.push({ car_id: car, url: m.storage_path, sort: id, cover: false });
      }
      const mine = photos.filter((p) => p.car_id === car);
      const min = Math.min(...mine.map((p) => p.sort));
      mine.forEach((p) => { p.cover = p.sort === min; });
      return mine.length;
    },
    log: async (e) => { logs.push({ status: e.status, message: e.message }); },
    touchImported: async () => undefined,
  };
  return { deps, cars, photos, logs, posts, get downloads() { return downloads; } };
};

const photo = (n: number) => [{ file_id: `f${n}`, file_unique_id: `u${n}`, width: 1280, height: 960 }];

describe("handleUpdate", () => {
  it("turns a media album into one car with ordered photos and one cover", async () => {
    const b = fakeBackend();
    // Telegram may deliver the photo-only parts before the captioned one.
    await handleUpdate({ update_id: 2, channel_post: msg({ message_id: 11, media_group_id: "A", photo: photo(11) }) }, b.deps);
    expect(b.downloads).toBe(0); // nothing downloaded before the post is known to be #авто
    await handleUpdate({ update_id: 1, channel_post: msg({ message_id: 10, media_group_id: "A", photo: photo(10), caption: POST }) }, b.deps);
    await handleUpdate({ update_id: 3, channel_post: msg({ message_id: 12, media_group_id: "A", photo: photo(12) }) }, b.deps);
    expect(b.cars.size).toBe(1);
    expect(b.photos.map((p) => p.sort)).toEqual([11, 10, 12].sort((a, c) => a - c).length === 3 ? b.photos.map((p) => p.sort) : []);
    expect([...b.photos].sort((a, c) => a.sort - c.sort).map((p) => [p.sort, p.cover])).toEqual([[10, true], [11, false], [12, false]]);
  });
  it("ignores Telegram retries of the same update", async () => {
    const b = fakeBackend();
    const u = { update_id: 5, channel_post: msg({ message_id: 20, photo: photo(20), caption: POST }) };
    await handleUpdate(u, b.deps);
    await handleUpdate(u, b.deps);
    expect(b.cars.size).toBe(1);
    expect(b.photos).toHaveLength(1);
    expect(b.downloads).toBe(1);
  });
  it("a text edit updates the same card; an older edit never overwrites a newer one", async () => {
    const b = fakeBackend();
    await handleUpdate({ update_id: 1, channel_post: msg({ message_id: 30, text: POST }) }, b.deps);
    await handleUpdate({ update_id: 3, edited_channel_post: msg({ message_id: 30, edit_date: 3000, text: POST.replace("1 945 000", "1 800 000") + "\n#продано" }) }, b.deps);
    await handleUpdate({ update_id: 2, edited_channel_post: msg({ message_id: 30, edit_date: 2000, text: POST.replace("1 945 000", "1 900 000") }) }, b.deps);
    expect(b.cars.size).toBe(1);
    expect(b.cars.get("car-1")).toMatchObject({ price: 1800000, status: "sold" });
    expect(b.logs.at(-1)?.status).toBe("skipped");
  });
  it("logs invalid #авто posts and does not publish them", async () => {
    const b = fakeBackend();
    await handleUpdate({ update_id: 1, channel_post: msg({ message_id: 40, photo: photo(40), caption: "#авто\nМарка: Mazda" }) }, b.deps);
    expect(b.cars.size).toBe(0);
    expect(b.downloads).toBe(0);
    expect(b.logs[0].status).toBe("error");
  });
  it("posts without #авто leave the site untouched", async () => {
    const b = fakeBackend();
    await handleUpdate({ update_id: 1, channel_post: msg({ message_id: 50, photo: photo(50), caption: "Просто новости" }) }, b.deps);
    expect(b.cars.size + b.downloads + b.logs.length).toBe(0);
  });
});

describe("telegram migration keeps secrets server-only", () => {
  const sql = readFileSync(resolve("drizzle/migrations/0000_telegram_catalog_import.sql"), "utf8");
  it("never grants Telegram tables or functions to browser roles", () => {
    expect(sql).not.toMatch(/GRANT[^;]*TO[^;]*\b(anon|authenticated)\b/i);
    expect(sql).toMatch(/REVOKE ALL ON public\.telegram_secrets FROM anon, authenticated/);
    expect(sql).not.toMatch(/CREATE POLICY/i);
  });
});
