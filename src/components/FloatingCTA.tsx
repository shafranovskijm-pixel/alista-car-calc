import { useState } from "react";
import { Phone, MessageCircle, Send, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
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
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-white shadow-lg ${it.bg}`}
              aria-label={it.label}
            >
              <it.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{it.label}</span>
            </motion.a>
          ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Закрыть меню связи" : "Открыть меню связи"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-105 transition-transform pulse-glow"
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default FloatingCTA;