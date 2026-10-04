import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MAX_CAR_PHOTO_BYTES, validateCarPhoto } from "./cars";

const carsSource = readFileSync(resolve("src/lib/cars.ts"), "utf8");

describe("validateCarPhoto", () => {
  it.each([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])("accepts %s and returns a safe extension", (type, extension) => {
    expect(validateCarPhoto({ type, size: 1024 })).toBe(extension);
  });

  it("rejects formats that should not be served as catalogue images", () => {
    expect(() => validateCarPhoto({ type: "image/svg+xml", size: 1024 })).toThrow(
      "Поддерживаются фотографии JPG, PNG и WebP",
    );
  });

  it("rejects empty and oversized files", () => {
    expect(() => validateCarPhoto({ type: "image/jpeg", size: 0 })).toThrow("10 МБ");
    expect(() =>
      validateCarPhoto({ type: "image/jpeg", size: MAX_CAR_PHOTO_BYTES + 1 }),
    ).toThrow("10 МБ");
  });

  it("keeps browser caching within the signed URL lifetime", () => {
    expect(carsSource).toContain("cacheControl: String(SIGNED_TTL)");
    expect(carsSource).not.toContain('cacheControl: "31536000"');
  });
});
