export type UtmFields = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

const STORAGE_KEY = "alista_utm";

export const captureUtm = (): UtmFields => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const keys: (keyof UtmFields)[] = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  const captured: UtmFields = {};
  keys.forEach((k) => {
    const v = params.get(k);
    if (v) captured[k] = v.slice(0, 200);
  });
  if (Object.keys(captured).length) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
    } catch {}
    return captured;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UtmFields;
  } catch {}
  return {};
};