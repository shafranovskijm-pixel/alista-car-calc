import { beforeEach, describe, expect, it } from "vitest";
import {
  METRIKA_CONSENT_STORAGE_KEY,
  getMetrikaGoalForHref,
  parseMetrikaId,
  readMetrikaConsent,
  writeMetrikaConsent,
} from "./metrika";

describe("Yandex Metrika helpers", () => {
  beforeEach(() => window.localStorage.clear());

  it("accepts only positive numeric counter IDs", () => {
    expect(parseMetrikaId("12345678")).toBe(12345678);
    expect(parseMetrikaId(" 12345678 ")).toBe(12345678);
    expect(parseMetrikaId(undefined)).toBeNull();
    expect(parseMetrikaId("counter-id")).toBeNull();
    expect(parseMetrikaId("0")).toBeNull();
  });

  it("stores an explicit analytics choice", () => {
    expect(readMetrikaConsent()).toBeNull();
    writeMetrikaConsent("accepted");
    expect(window.localStorage.getItem(METRIKA_CONSENT_STORAGE_KEY)).toBe("accepted");
    expect(readMetrikaConsent()).toBe("accepted");
  });

  it("maps only the requested contact actions to goals", () => {
    expect(getMetrikaGoalForHref("tel:+79140730196")).toBe("phone_click");
    expect(getMetrikaGoalForHref("https://wa.me/79140730196")).toBe("whatsapp_click");
    expect(getMetrikaGoalForHref("https://t.me/example")).toBe("telegram_click");
    expect(getMetrikaGoalForHref("https://alistaru.ru/contacts")).toBeNull();
  });
});
