import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
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
  const [cars, setCars] = useState<CarWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const rows = await withRetry(() => fetchPublicCars());
        if (!cancelled) setCars(rows.slice(0, 6));
      } catch {
        if (!cancelled) {
          setCars([]);
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

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="Загрузка автомобилей">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-border bg-card px-6 py-10 text-center">
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
      </div>
    );
  }

  return (
    <>
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
