import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./hooks/useTheme";
import "./index.css";

// Apply persisted theme before first paint to avoid flash
try {
  const saved = localStorage.getItem("alista-theme");
  const t = saved === "light" ? "light" : "dark";
  document.documentElement.classList.add(t);
  document.documentElement.style.colorScheme = t;
} catch {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
