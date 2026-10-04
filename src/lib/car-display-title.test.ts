import { describe, expect, it } from "vitest";
import { makeCarDisplayTitle } from "@/lib/cars";

describe("makeCarDisplayTitle", () => {
  it("prefers a custom title", () => {
    expect(makeCarDisplayTitle("  Проверенный автомобиль  ", "Toyota", "Prius", 2022)).toBe(
      "Проверенный автомобиль",
    );
  });

  it("builds a title from the vehicle fields", () => {
    expect(makeCarDisplayTitle("", " Toyota ", " Prius ", 2022)).toBe(
      "Toyota Prius 2022",
    );
  });

  it("uses a clear placeholder for a new draft", () => {
    expect(makeCarDisplayTitle("", "", "", null)).toBe("Новый автомобиль");
  });
});
