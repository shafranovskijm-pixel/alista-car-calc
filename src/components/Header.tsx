import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import logoImg from "@/assets/logo-alista.png";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { to: "/", label: "Главная" },
  { to: "/cars", label: "Авто" },
  { to: "/calculator", label: "Калькулятор" },
  { to: "/services", label: "Услуги" },
  { to: "/works", label: "Наши работы" },
  { to: "/about", label: "О компании" },
  { to: "/contacts", label: "Контакты" },
];

const Header = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between md:h-20">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoImg} alt="ALISTA" className="h-10 w-10 md:h-12 md:w-12" width={48} height={48} />
          <span className="font-heading text-xl font-bold tracking-wider text-foreground md:text-2xl">
            ALISTA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.to
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href="tel:+79841982733" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Phone className="h-4 w-4" />
            +7 984 198-27-33
          </a>
          <ThemeToggle />
          <Link
            to="/admin/login"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-primary"
            title="Вход в CRM"
          >
            <LogIn className="h-4 w-4" />
            Войти
          </Link>
          <Link to="/calculator">
            <Button className="gradient-accent font-semibold text-primary-foreground hover:opacity-90">
              Рассчитать
            </Button>
          </Link>
        </div>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background border-border">
            <SheetTitle className="sr-only">Навигация</SheetTitle>
            <nav className="mt-8 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-4 py-3 text-base font-medium transition-colors hover:bg-secondary ${
                    location.pathname === link.to
                      ? "text-primary bg-secondary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 border-t border-border pt-4">
                <a href="tel:+79841982733" className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  +7 984 198-27-33
                </a>
                <Link
                  to="/admin/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <LogIn className="h-4 w-4" />
                  Войти в CRM
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
