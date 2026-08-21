import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "./hooks/useTheme";
import "./index.css";

// Apply persisted theme before first paint to avoid flash
try {
  const saved = localStorage.getItem("alista-theme");
  const t = saved === "light" ? "light" : "dark";
  if (!window.location.pathname.startsWith("/admin")) {
    document.documentElement.classList.add("public-site-active");
  }
  document.documentElement.classList.add(t);
  document.documentElement.style.colorScheme = document.documentElement.classList.contains("public-site-active") ? "light" : t;
} catch {
  if (!window.location.pathname.startsWith("/admin")) {
    document.documentElement.classList.add("public-site-active");
    document.documentElement.style.colorScheme = "light";
  } else {
    document.documentElement.classList.add("dark");
  }
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
);
