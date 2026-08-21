import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Calendar, MapPin, Search, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchPublishedWorks, type WorkWithPhotos } from "@/lib/works";
import { withRetry } from "@/lib/retry";
import { retryImageOnce } from "@/lib/image";

type Work = {
  id: string;
  date: string;
  title: string;
  price: number | null;
  country: string | null;
  description: string | null;
  photos: string[];
};

const formatPrice = (p: number | null) =>
  p ? new Intl.NumberFormat("ru-RU").format(p) + " ₽" : "Цена по запросу";

const formatDate = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU");
};

const PAGE = 12;

const Works = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [active, setActive] = useState<Work | null>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    document.title = "Наши работы — опубликованные автомобили | ALISTA";
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const rows = await withRetry(fetchPublishedWorks);
        const mapped: Work[] = rows.map((w: WorkWithPhotos) => ({
          id: w.id,
          date: formatDate(w.source_date),
          title: w.title,
          price: w.price,
          country: w.country,
          description: w.description,
          photos: w.photos.map((p) => p.url).filter(Boolean),
        }));
        if (!cancelled) setWorks(mapped);
      } catch {
        if (!cancelled) {
          setWorks([]);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return works.filter((w) => {
      if (country && w.country !== country) return false;
      if (q && !(`${w.title} ${w.description ?? ""}`).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, country, works]);

  const visible = filtered.slice(0, shown);
  const countries = ["Китай", "Япония", "Корея"].filter((c) => works.some((w) => w.country === c));

  const navigate = (dir: number) => {
    if (!active) return;
    setSlide((s) => (s + dir + active.photos.length) % active.photos.length);
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <Layout>
      <section className="container relative py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            Каталог реализованных авто
          </Badge>
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-5xl">
            Наши <span className="text-primary text-glow">работы</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Опубликованные карточки автомобилей с фотографиями, ценами и комплектациями.
          </p>
        </motion.div>

        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
              placeholder="Найти марку, модель..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setCountry(null); setShown(PAGE); }}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                country === null ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Все ({works.length})
            </button>
            {countries.map((c) => (
              <button
                key={c}
                onClick={() => { setCountry(c); setShown(PAGE); }}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  country === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : failed ? (
          <div className="py-20 text-center text-muted-foreground">
            <p>Не удалось загрузить опубликованные работы.</p>
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Повторить загрузку
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">Ничего не найдено</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((w, i) => (
              <motion.button
                key={w.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % PAGE) * 0.04, duration: 0.35 }}
                onClick={() => { setActive(w); setSlide(0); }}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card text-left transition hover:border-primary/40 hover:box-glow"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                  <img
                    src={w.photos[0] || "/placeholder.svg"}
                    alt={w.title}
                    loading="lazy"
                    onError={retryImageOnce}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent" />
                  {w.photos.length > 1 && (
                    <span className="absolute right-2 top-2 rounded-md bg-background/80 px-2 py-0.5 text-xs text-foreground backdrop-blur">
                      +{w.photos.length - 1}
                    </span>
                  )}
                  {w.country && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      <MapPin className="h-3 w-3" /> {w.country}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 font-heading text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {w.title}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base font-bold text-primary">{formatPrice(w.price)}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /> {w.date}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {shown < filtered.length && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setShown((s) => s + PAGE)}
              className="rounded-full border border-primary/40 bg-primary/10 px-6 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
            >
              Показать ещё ({filtered.length - shown})
            </button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
            onClick={() => setActive(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setActive(null); }}
              className="absolute right-4 top-4 rounded-full bg-secondary/80 p-2 text-foreground hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>

            {active.photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                  className="absolute left-2 md:left-6 rounded-full bg-secondary/80 p-2 text-foreground hover:bg-secondary"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(1); }}
                  className="absolute right-2 md:right-6 rounded-full bg-secondary/80 p-2 text-foreground hover:bg-secondary"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div
              className="relative grid max-h-[90vh] w-[95vw] max-w-6xl gap-4 overflow-y-auto md:grid-cols-[1fr_320px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center">
                <motion.img
                  key={active.id + slide}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={active.photos[slide] || "/placeholder.svg"}
                  onError={retryImageOnce}
                  alt={active.title}
                  className="max-h-[80vh] w-full rounded-xl object-contain"
                />
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5">
                <h2 className="font-heading text-xl font-bold text-foreground">{active.title}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" /> {active.date}
                  {active.country && <><span>•</span><MapPin className="h-4 w-4" /> {active.country}</>}
                </div>
                <div className="text-2xl font-bold text-primary">{formatPrice(active.price)}</div>
                {active.description && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {active.description}
                  </p>
                )}
                <div className="mt-auto flex flex-col gap-2">
                  <a
                    href="/calculator"
                    className="rounded-md gradient-accent px-4 py-2 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Рассчитать похожий
                  </a>
                  <a
                    href="/contacts"
                    className="rounded-md border border-border px-4 py-2 text-center text-sm text-foreground hover:bg-secondary"
                  >
                    Связаться
                  </a>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-1.5">
                  {active.photos.map((p, idx) => (
                    <button
                      key={p}
                      onClick={() => setSlide(idx)}
                      className={`aspect-square overflow-hidden rounded border-2 transition ${
                        idx === slide ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={p} alt="" className="h-full w-full object-cover" loading="lazy" onError={retryImageOnce} />
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {slide + 1} / {active.photos.length}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Works;
