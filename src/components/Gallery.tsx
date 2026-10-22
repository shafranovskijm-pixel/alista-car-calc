import { useCatalogLiveRefresh } from "@/hooks/useCatalogLiveRefresh";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CAR_COUNTRY_LABELS,
  CAR_STATUS_LABELS,
  fetchPublicCars,
  formatPrice,
  type CarWithPhotos,
} from "@/lib/cars";
import { withRetry } from "@/lib/retry";
import { retryImageOnce } from "@/lib/image";

const Gallery = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [cars, setCars] = useState<CarWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const hasDataRef = useRef(false);
  hasDataRef.current = cars.length > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasDataRef.current) setLoading(true);
      setFailed(false);
      try {
        const rows = await withRetry(() => fetchPublicCars());
        if (!cancelled) setCars(rows.filter((car) => car.status !== "draft").slice(0, 6));
      } catch {
        if (!cancelled) {
          if (!hasDataRef.current) setCars([]);
          if (!hasDataRef.current) setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useCatalogLiveRefresh(() => setReloadKey((value) => value + 1));

  useEffect(() => {
    let lastRefresh = 0;
    const refresh = () => {
      if (document.visibilityState !== "hidden" && Date.now() - lastRefresh > 250) {
        lastRefresh = Date.now();
        setReloadKey((value) => value + 1);
      }
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  const searchForm = (
    <form className="mb-6 min-w-0 rounded-xl border border-border/50 bg-card/60 p-4" role="search" onSubmit={(event) => {
      event.preventDefault();
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      navigate(`/cars${params.toString() ? `?${params.toString()}` : ""}`);
    }}>
      <label htmlFor="home-car-search" className="mb-2 block text-sm font-semibold text-foreground">Найти автомобиль в полном каталоге</label>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input id="home-car-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Марка или модель, например Toyota C-HR" className="min-w-0 pl-10" /></div>
        <Button type="submit">Найти авто</Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Все опубликованные автомобили, включая новые из CRM. Фильтры — в полном каталоге.</p>
    </form>
  );

  if (loading) {
    return (
      <>{searchForm}<div className="flex justify-center py-16" role="status" aria-label="Загрузка автомобилей">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div></>
    );
  }

  if (cars.length === 0) {
    return (
      <>{searchForm}<div className="rounded-[1.5rem] border border-dashed border-border bg-card px-6 py-10 text-center">
        <p className="font-heading font-semibold text-foreground">
          {failed ? "Не удалось загрузить автомобили" : "Автомобили пока не добавлены"}
        </p>
        <Link to="/cars" className="mt-5 inline-flex rounded-full border border-primary/30 px-5 py-2 text-sm font-semibold text-primary hover:bg-secondary">
          Открыть каталог автомобилей
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
      </div></>
    );
  }

  return (
    <>
      {searchForm}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((car, index) => {
          const cover = car.photos.find((photo) => photo.is_cover) ?? car.photos[0];
          const title = car.title || `${car.brand} ${car.model}`;
          return (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className="min-w-0"
            >
              <Link
                to={`/cars/${car.slug}`}
                className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                  {cover?.url ? (
                    <img
                      src={cover.url}
                      alt={title}
                      loading="lazy"
                      width={800}
                      height={600}
                      onError={retryImageOnce}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Нет фото</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-primary/10 px-2 py-1 text-primary">{CAR_STATUS_LABELS[car.status]}</span>
                    <span className="rounded bg-secondary px-2 py-1 text-muted-foreground">{CAR_COUNTRY_LABELS[car.country]}</span>
                  </div>
                  <h3 className="break-words font-heading font-semibold text-foreground">{title}{car.year ? ` · ${car.year}` : ""}</h3>
                  <p className="mt-3 text-lg font-bold text-primary">{formatPrice(car.price, car.currency)}</p>
                  <span className="mt-auto pt-3 text-sm font-medium text-muted-foreground group-hover:text-primary">Подробнее об автомобиле →</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-8 text-center">
        <Link to="/cars" className="inline-block rounded-full border border-primary/40 bg-primary/10 px-6 py-2 text-sm font-medium text-primary transition hover:bg-primary/20">
          Смотреть все автомобили →
        </Link>
      </div>
    </>
  );
};

export default Gallery;
