import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => (
  <footer className="border-t border-border bg-[#102820] text-white">
    <div className="container py-12 md:py-16">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:gap-14">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#08764d] text-xl font-black text-white">A</span>
            <span>
              <span className="block font-heading text-xl font-extrabold tracking-[0.08em]">ALISTA</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.13em] text-white/50">таможенное оформление</span>
            </span>
          </Link>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/60">
            ООО «Алиста» — таможенное оформление автомобилей и других транспортных средств во Владивостоке.
          </p>
          <Button asChild variant="outline" className="mt-6 rounded-full border-white/20 bg-white/5 text-white hover:bg-white hover:text-[#102820]">
            <Link to="/calculator">Рассчитать платежи <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#6be2aa]">Разделы</h2>
          <nav className="mt-5 grid gap-3 text-sm" aria-label="Навигация в подвале">
            <Link to="/cars" className="text-white/65 hover:text-white">Автомобили</Link>
            <Link to="/calculator" className="text-white/65 hover:text-white">Калькулятор</Link>
            <Link to="/services" className="text-white/65 hover:text-white">Услуги</Link>
            <Link to="/works" className="text-white/65 hover:text-white">Опубликованные работы</Link>
            <Link to="/about" className="text-white/65 hover:text-white">О компании</Link>
            <Link to="/contacts" className="text-white/65 hover:text-white">Контакты</Link>
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#6be2aa]">Контакты</h2>
          <div className="mt-5 space-y-4 text-sm text-white/65">
            <a href="tel:+79140730196" className="flex items-center gap-3 font-semibold text-white hover:text-[#6be2aa]"><Phone className="h-4 w-4 text-[#6be2aa]" />+7 914 073-01-96</a>
            <p className="flex items-start gap-3 leading-relaxed"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6be2aa]" /><span>690911, г. Владивосток,<br />Океанский проспект, д. 136, кв. 84</span></p>
            <p>Пн–Пт, 9:00–18:00</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="https://wa.me/79140730196" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/30 hover:text-white">WhatsApp</a>
            <a href="https://t.me/+79140730196" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:border-white/30 hover:text-white">Telegram</a>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-4 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/45 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p>ООО «Алиста» · ИНН 2543194698 · КПП 254301001</p>
          <p className="mt-2 max-w-3xl">Информация и результаты онлайн-калькулятора носят справочный характер и не являются публичной офертой. Уточнённая сумма подтверждается после проверки исходных данных.</p>
        </div>
        <div className="md:text-right">
          <p>© {new Date().getFullYear()} ООО «Алиста»</p>
          <p className="mt-1">Разработка: <a href="https://24zxc.ru" target="_blank" rel="noopener noreferrer" className="text-white/65 hover:text-white">24zxc.ru</a></p>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
