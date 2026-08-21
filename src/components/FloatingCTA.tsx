import { useState } from "react";
import { Calculator, Phone, MessageCircle, Send, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const PHONE = "79140730196";

const FloatingCTA = () => {
  const [open, setOpen] = useState(false);

  const items = [
    {
      key: "wa",
      label: "WhatsApp",
      href: `https://wa.me/${PHONE}`,
      icon: MessageCircle,
      bg: "bg-[#25D366] hover:bg-[#1da851]",
    },
    {
      key: "tg",
      label: "Telegram",
      href: `https://t.me/+${PHONE}`,
      icon: Send,
      bg: "bg-[#229ED9] hover:bg-[#1c80b0]",
    },
    {
      key: "tel",
      label: "Позвонить",
      href: `tel:+${PHONE}`,
      icon: Phone,
      bg: "bg-primary hover:bg-primary/90",
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
      <AnimatePresence>
        {open &&
          items.map((it, i) => (
            <motion.a
              key={it.key}
              href={it.href}
              target={it.key === "tel" ? undefined : "_blank"}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ delay: i * 0.04 }}
              className={`flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-white shadow-lg ${it.bg}`}
              aria-label={it.label}
            >
              <it.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{it.label}</span>
            </motion.a>
          ))}
      </AnimatePresence>
      <div className="flex items-center gap-2">
        <Link
          to="/calculator"
          className="hidden h-12 items-center gap-2 rounded-full bg-[#102820] px-5 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 sm:flex"
        >
          <Calculator className="h-4 w-4 text-[#6be2aa]" />
          Рассчитать
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Закрыть меню связи" : "Открыть меню связи"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/25 transition-transform hover:scale-105 sm:h-[3.25rem] sm:w-[3.25rem]"
        >
          {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
};

export default FloatingCTA;
