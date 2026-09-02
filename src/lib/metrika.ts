export const METRIKA_CONSENT_STORAGE_KEY = "alista_analytics_consent";

export type MetrikaConsent = "accepted" | "declined" | null;
export type MetrikaGoal =
  | "lead_form_success"
  | "phone_click"
  | "whatsapp_click"
  | "telegram_click";

type MetrikaCommand =
  | [number, "init", Record<string, boolean>]
  | [number, "hit", string, { title: string; referer?: string }]
  | [number, "reachGoal", MetrikaGoal]
  | [number, "destruct"];

declare global {
  interface Window {
    ym?: ((...args: MetrikaCommand) => void) & { a?: unknown[]; l?: number };
    [key: `disableYaCounter${number}`]: boolean | undefined;
  }
}

export const parseMetrikaId = (rawValue: string | undefined): number | null => {
  if (!rawValue || !/^\d+$/.test(rawValue.trim())) return null;
  const id = Number(rawValue.trim());
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const METRIKA_ID = parseMetrikaId(import.meta.env.VITE_YANDEX_METRIKA_ID);

const getDisableKey = (id: number): `disableYaCounter${number}` => `disableYaCounter${id}`;
let sessionConsent: MetrikaConsent = null;
let initialized = false;
let lastTrackedUrl = "";
let previousTrackedUrl = typeof document === "undefined" ? "" : document.referrer;

export const readMetrikaConsent = (): MetrikaConsent => {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(METRIKA_CONSENT_STORAGE_KEY);
    return value === "accepted" || value === "declined" ? value : sessionConsent;
  } catch {
    return sessionConsent;
  }
};

export const writeMetrikaConsent = (consent: Exclude<MetrikaConsent, null>) => {
  sessionConsent = consent;
  try {
    window.localStorage.setItem(METRIKA_CONSENT_STORAGE_KEY, consent);
  } catch {
    // Tracking remains governed by in-memory consent when storage is unavailable.
  }
};

const ensureQueue = () => {
  if (window.ym) return window.ym;
  const queue = ((...args: MetrikaCommand) => {
    queue.a = queue.a || [];
    queue.a.push(args);
  }) as NonNullable<Window["ym"]>;
  queue.l = Date.now();
  window.ym = queue;
  return queue;
};

export const initializeMetrika = (): boolean => {
  if (!METRIKA_ID || typeof document === "undefined" || readMetrikaConsent() !== "accepted") {
    return false;
  }

  window[getDisableKey(METRIKA_ID)] = false;
  const ym = ensureQueue();
  const scriptId = "yandex-metrika-tag";
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    document.head.appendChild(script);
  }
  if (!initialized) {
    ym(METRIKA_ID, "init", {
      defer: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false,
    });
    initialized = true;
  }
  return true;
};

export const destroyMetrika = () => {
  if (!METRIKA_ID || typeof window === "undefined") return;
  if (initialized) window.ym?.(METRIKA_ID, "destruct");
  initialized = false;
  lastTrackedUrl = "";
  window[getDisableKey(METRIKA_ID)] = true;
};

export const sendMetrikaHit = (url: string, title: string, referer?: string) => {
  if (!METRIKA_ID || readMetrikaConsent() !== "accepted" || !window.ym) return;
  window.ym(METRIKA_ID, "hit", url, { title, ...(referer ? { referer } : {}) });
};

export const trackMetrikaPageView = (url: string, title: string) => {
  if (!initializeMetrika() || lastTrackedUrl === url) return;
  sendMetrikaHit(url, title, previousTrackedUrl || undefined);
  previousTrackedUrl = url;
  lastTrackedUrl = url;
};

export const reachMetrikaGoal = (goal: MetrikaGoal) => {
  if (!METRIKA_ID || readMetrikaConsent() !== "accepted" || !window.ym) return;
  window.ym(METRIKA_ID, "reachGoal", goal);
};

export const getMetrikaGoalForHref = (href: string): MetrikaGoal | null => {
  const normalized = href.trim().toLowerCase();
  if (normalized.startsWith("tel:")) return "phone_click";

  try {
    const url = new URL(href, window.location.origin);
    if (url.hostname === "wa.me" || url.hostname.endsWith(".wa.me")) return "whatsapp_click";
    if (url.hostname === "t.me" || url.hostname.endsWith(".t.me")) return "telegram_click";
  } catch {
    return null;
  }

  return null;
};
