import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CAROUSEL_DOWNLOADS, JAPAN_IMPORT_CAPTION, JAPAN_IMPORT_CARDS, isShareCancelled, loadCarouselShareFiles } from "./japan-import-carousel";

afterEach(() => vi.unstubAllGlobals());

describe("Japan import carousel assets", () => {
  it("ships the original images, previews, caption and downloadable package", () => {
    JAPAN_IMPORT_CARDS.forEach((card) => {
      const original = readFileSync(resolve("public", card.original.slice(1)));
      expect(original.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(original.readUInt32BE(16)).toBe(1092);
      expect(original.readUInt32BE(20)).toBe(1440);
      const preview = readFileSync(resolve("public", card.preview.slice(1)));
      expect(preview.subarray(0, 4).toString()).toBe("RIFF");
      expect(preview.subarray(8, 12).toString()).toBe("WEBP");
    });
    expect(readFileSync(resolve("public", CAROUSEL_DOWNLOADS.caption.slice(1)), "utf8").replace(/\r\n/g, "\n").trim()).toBe(JAPAN_IMPORT_CAPTION);
    expect(statSync(resolve("public", CAROUSEL_DOWNLOADS.package.slice(1))).size).toBeGreaterThan(1_000_000);
  });

  it("contains eight numbered cards in the order used for sharing", () => {
    expect(JAPAN_IMPORT_CARDS).toHaveLength(8);
    expect(JAPAN_IMPORT_CARDS.map((card) => card.number)).toEqual(["01", "02", "03", "04", "05", "06", "07", "08"]);
    JAPAN_IMPORT_CARDS.forEach((card) => {
      expect(card.preview).toBe(`/media/japan-import-guide/${card.stem}.webp`);
      expect(card.original).toBe(`/media/japan-import-guide/${card.stem}.png`);
    });
    expect(CAROUSEL_DOWNLOADS.package).toMatch(/ALISTA-Instagram-carousel\.zip$/);
    expect(JAPAN_IMPORT_CAPTION).toContain("+7 914 073-01-96");
    expect(JAPAN_IMPORT_CAPTION).toContain("@alistaavto25");
    expect(JAPAN_IMPORT_CAPTION).toContain("предварительный расчёт");
    expect(JAPAN_IMPORT_CAPTION).toContain("не фотографии конкретных доставленных автомобилей");
  });

  it("loads PNG originals as ordered files without credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["png"], { type: "image/png" }) });
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    const files = await loadCarouselShareFiles(controller.signal);

    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(fetchMock).toHaveBeenNthCalledWith(1, JAPAN_IMPORT_CARDS[0].original, { signal: controller.signal, credentials: "omit" });
    expect(files.map((file) => file.name)).toEqual(JAPAN_IMPORT_CARDS.map((card) => `${card.stem}.png`));
    expect(files.every((file) => file.type === "image/png" && file.size > 0)).toBe(true);
  });

  it("rejects a missing asset and does not treat SPA HTML as an image", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["<html>"], { type: "text/html" }) }));
    await expect(loadCarouselShareFiles()).rejects.toThrow("изображение карточки");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(loadCarouselShareFiles()).rejects.toThrow("загрузить карточку");
  });

  it("recognises user cancellation separately from share errors", () => {
    expect(isShareCancelled(new DOMException("Cancelled", "AbortError"))).toBe(true);
    expect(isShareCancelled(new DOMException("Blocked", "NotAllowedError"))).toBe(false);
    expect(isShareCancelled(new Error("Failed"))).toBe(false);
  });
});
