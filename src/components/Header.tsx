import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calculator, Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { to: "/cars", label: "Автомобили" },
  { to: "/calculator", label: "Калькулятор" },
  { to: "/services", label: "Услуги" },
  { to: "/works", label: "Работы" },
  { to: "/about", label: "О компании" },
  { to: "/contacts", label: "Контакты" },
];

const Header = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(`${path}/`));

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-5 md:h-20">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="ALISTA — на главную">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground shadow-sm md:h-12 md:w-12 md:text-xl">A</span>
          <span>
            <span className="block font-heading text-lg font-extrabold leading-none tracking-[0.08em] text-foreground md:text-xl">ALISTA</span>
            <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:block">таможенное оформление</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Основная навигация">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                isActive(link.to)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <a href="tel:+79140730196" className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary">
            <Phone className="h-4 w-4 text-primary" />
            +7 914 073-01-96
          </a>
          <Button asChild className="rounded-full px-5 font-bold">
            <Link to="/calculator"><Calculator className="h-4 w-4" />Рассчитать</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <Button asChild size="icon" variant="ghost" className="rounded-full sm:hidden">
            <a href="tel:+79140730196" aria-label="Позвонить"><Phone className="h-5 w-5" /></a>
          </Button>
          <Button asChild size="sm" className="hidden rounded-full px-4 font-bold sm:inline-flex">
            <Link to="/calculator"><Calculator className="h-4 w-4" />Рассчитать</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full" aria-label="Открыть меню"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(88vw,360px)] border-border bg-background p-6">
              <SheetTitle className="text-left font-heading text-xl font-bold text-foreground">Меню</SheetTitle>
              <SheetDescription className="sr-only">Навигация по сайту ALISTA</SheetDescription>
              <nav className="mt-8 flex flex-col gap-1" aria-label="Мобильная навигация">
                <Link to="/" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-base font-semibold text-foreground hover:bg-secondary">Главная</Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`rounded-xl px-4 py-3 text-base font-semibold transition-colors ${isActive(link.to) ? "bg-secondary text-primary" : "text-foreground hover:bg-secondary"}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-7 border-t border-border pt-6">
                <a href="tel:+79140730196" className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-4 font-bold text-foreground">
                  <Phone className="h-5 w-5 text-primary" />+7 914 073-01-96
                </a>
                <Button asChild size="lg" className="mt-3 w-full rounded-xl font-bold">
                  <Link to="/calculator" onClick={() => setOpen(false)}>Рассчитать платежи</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
