import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchPublishedWorks } from "@/lib/works";
import { withRetry } from "@/lib/retry";
import { retryImageOnce } from "@/lib/image";

type Item = { src: string; title: string; desc: string };

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const rows = await withRetry(fetchPublishedWorks);
        const items: Item[] = rows
          .map((w) => {
            const cover = w.photos.find((p) => p.is_cover) ?? w.photos[0];
            if (!cover?.url) return null;
            return {
              src: cover.url,
              title: w.title,
              desc: [w.country, w.price ? new Intl.NumberFormat("ru-RU").format(w.price) + " ₽" : null]
                .filter(Boolean)
                .join(" · "),
            };
          })
          .filter(Boolean) as Item[];
        if (!cancelled) setGalleryItems(items.slice(0, 6));
      } catch {
        if (!cancelled) {
          setGalleryItems([]);
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (lightbox === null) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [lightbox]);

  const navigate = (dir: number) => {
    if (lightbox === null) return;
    setLightbox((lightbox + dir + galleryItems.length) % galleryItems.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="Загрузка опубликованных работ">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (galleryItems.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-border bg-card px-6 py-10 text-center">
        <p className="font-heading font-semibold text-foreground">
          {failed ? "Не удалось загрузить опубликованные работы" : "Опубликованные работы пока не добавлены"}
        </p>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {failed
            ? "Можно перейти в полный каталог и повторить загрузку или запросить примеры у менеджера."
            : "Когда карточки будут опубликованы в рабочей базе, они автоматически появятся здесь."}
        </p>
        <Link to="/works" className="mt-5 inline-flex rounded-full border border-primary/30 px-5 py-2 text-sm font-semibold text-primary hover:bg-secondary">
          Открыть каталог работ
        </Link>
        {failed && (
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="ml-3 mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Повторить загрузку
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galleryItems.map((item, i) => (
          <motion.button
            key={i}
            type="button"
            aria-label={`Открыть фото: ${item.title}`}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="group relative overflow-hidden rounded-xl border border-border/50 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => setLightbox(i)}
          >
            <img
              src={item.src}
              alt={item.title}
              loading="lazy"
              width={800}
              height={600}
              onError={retryImageOnce}
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100" />
            <div className="absolute bottom-0 left-0 right-0 translate-y-0 p-4 opacity-100 transition-all duration-300 sm:translate-y-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-visible:translate-y-0 sm:group-focus-visible:opacity-100">
              <p className="font-heading font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/works"
          className="inline-block rounded-full border border-primary/40 bg-primary/10 px-6 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
        >
          Смотреть все работы →
        </Link>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Фото: ${galleryItems[lightbox].title}`}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-sm"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              aria-label="Закрыть фото"
              onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              type="button"
              aria-label="Предыдущее фото"
              onClick={(e) => { e.stopPropagation(); navigate(-1); }}
              className="absolute left-4 rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>

            <motion.img
              key={lightbox}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={galleryItems[lightbox].src}
              alt={galleryItems[lightbox].title}
              onError={retryImageOnce}
              className="max-h-[80vh] max-w-[90vw] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              type="button"
              aria-label="Следующее фото"
              onClick={(e) => { e.stopPropagation(); navigate(1); }}
              className="absolute right-4 rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            <div className="absolute bottom-8 text-center">
              <p className="font-heading font-semibold text-foreground">{galleryItems[lightbox].title}</p>
              <p className="text-sm text-muted-foreground">{galleryItems[lightbox].desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Gallery;
