import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  METRIKA_ID,
  destroyMetrika,
  getMetrikaGoalForHref,
  reachMetrikaGoal,
  readMetrikaConsent,
  trackMetrikaPageView,
  writeMetrikaConsent,
  type MetrikaConsent,
} from "@/lib/metrika";

const MetrikaManager = () => {
  const location = useLocation();
  const [consent, setConsent] = useState<MetrikaConsent>(() => readMetrikaConsent());
  const [settingsOpen, setSettingsOpen] = useState(() => readMetrikaConsent() === null);
  const isAdmin = location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  const isCalculatorRedirect = location.pathname === "/calculator";
  const isDynamicCar =
    /^\/cars\/[^/]+$/.test(location.pathname) &&
    !["/cars/japan", "/cars/korea", "/cars/china"].includes(location.pathname);

  useEffect(() => {
    if (isAdmin) destroyMetrika();
  }, [isAdmin]);

  useEffect(() => {
    if (!METRIKA_ID || consent !== "accepted" || isAdmin || isCalculatorRedirect) return;

    const frame = window.requestAnimationFrame(() => {
      if (isDynamicCar && document.title === "Автомобиль | ALISTA") return;
      trackMetrikaPageView(window.location.href, document.title);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [consent, isAdmin, isCalculatorRedirect, isDynamicCar, location.hash, location.pathname, location.search]);

  useEffect(() => {
    if (!METRIKA_ID || consent !== "accepted" || isAdmin) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const goal = getMetrikaGoalForHref(anchor.href);
      if (goal) reachMetrikaGoal(goal);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [consent, isAdmin]);

  if (!METRIKA_ID || isAdmin) return null;

  const accept = () => {
    writeMetrikaConsent("accepted");
    setConsent("accepted");
    setSettingsOpen(false);
  };

  const decline = () => {
    writeMetrikaConsent("declined");
    destroyMetrika();
    setConsent("declined");
    setSettingsOpen(false);
  };

  if (!settingsOpen) {
    return (
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-3 left-3 z-[60] rounded-full border border-border bg-background/90 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur hover:text-foreground md:bottom-5 md:left-5"
      >
        Настройки аналитики
      </button>
    );
  }

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-[70] max-w-xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur md:left-5 md:right-auto md:bottom-5"
      aria-label="Настройки аналитики"
    >
      <p className="text-sm font-semibold text-foreground">Помогите улучшать сайт</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        С вашего разрешения Яндекс Метрика будет считать посещения и обращения. Данные полей формы в аналитику не передаются.
      </p>
      <Link
        to="/privacy"
        className="mt-2 inline-block text-xs text-primary underline underline-offset-2"
      >
        Политика обработки данных ООО «Алиста»
      </Link>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button type="button" size="sm" onClick={accept}>
          Разрешить аналитику
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={decline}>
          Только необходимые
        </Button>
      </div>
    </aside>
  );
};

export default MetrikaManager;
