import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-heading text-xl font-bold text-foreground mb-4">ALISTA</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ООО «Алиста» — профессиональное таможенное оформление автомобилей и спецтехники во Владивостоке.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              ИНН 2543194698 · КПП 254301001
            </p>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Навигация</h4>
            <nav className="flex flex-col gap-2">
              {[
                { to: "/", label: "Главная" },
                { to: "/calculator", label: "Калькулятор" },
                { to: "/services", label: "Услуги" },
                { to: "/about", label: "О компании" },
                { to: "/contacts", label: "Контакты" },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-heading text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Контакты</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+79841982733" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4 shrink-0" />
                +7 984 198-27-33
              </a>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>690911, г. Владивосток, Океанский проспект, д. 136, кв. 84</span>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <a
                href="https://wa.me/79841982733"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href="https://t.me/+79841982733"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground space-y-2">
          <div>© {new Date().getFullYear()} ООО «Алиста». Все права защищены.</div>
          <div className="flex items-center justify-center gap-1">
            <span>Сделано</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse" />
            <a href="https://24zxc.ru" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">24zxc.ru</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
