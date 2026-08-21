import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "dark" | "light";
const STORAGE_KEY = "alista-theme";

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };
const ThemeCtx = createContext<Ctx | null>(null);

const getInitial = (): Theme => {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
};

const apply = (t: Theme) => {
  const root = document.documentElement;
  if (root.classList.contains("public-site-active")) {
    root.style.colorScheme = "light";
    return;
  }
  root.classList.toggle("light", t === "light");
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(getInitial);

  useEffect(() => {
    apply(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState((p) => (p === "dark" ? "light" : "dark"));

  return <ThemeCtx.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeCtx.Provider>;
};

export const useTheme = (): Ctx => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) return { theme: "dark", setTheme: () => {}, toggle: () => {} };
  return ctx;
};
