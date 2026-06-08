import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ExternalLink, Calendar, Gauge, Fuel, Settings2 } from "lucide-react";
import Layout from "@/components/Layout";
import PageTransition from "@/components/PageTransition";
import LeadForm from "@/components/LeadForm";
import {
  fetchCarPublic,
  CAR_COUNTRY_LABELS,
  CAR_STATUS_LABELS,
  CAR_TRANSMISSION_LABELS,
  CAR_FUEL_LABELS,
  formatPrice,
  type CarWithPhotos,
} from "@/lib/cars";

const CarDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [car, setCar] = useState<CarWithPhotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchCarPublic(slug)
      .then(setCar)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!car) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Авто не найдено</p>
          <Link to="/cars" className="text-primary hover:underline mt-4 inline-block">
            ← К каталогу
          </Link>
        </div>
      </Layout>
    );
  }

  const cover = car.photos[activePhoto] ?? car.photos[0];
  const specs: { icon: any; label: string; value: string }[] = [
    car.year ? { icon: Calendar, label: "Год", value: String(car.year) } : null,
    car.engine_volume
      ? { icon: Gauge, label: "Объём", value: `${car.engine_volume} л` }
      : null,
    car.power_hp ? { icon: Gauge, label: "Мощность", value: `${car.power_hp} л.с.` } : null,
    car.fuel ? { icon: Fuel, label: "Топливо", value: CAR_FUEL_LABELS[car.fuel] } : null,
    car.transmission
      ? { icon: Settings2, label: "КПП", value: CAR_TRANSMISSION_LABELS[car.transmission] }
      : null,
    car.mileage_km
      ? {
          icon: Gauge,
          label: "Пробег",
          value: `${new Intl.NumberFormat("ru-RU").format(car.mileage_km)} км`,
        }
      : null,
  ].filter(Boolean) as any;

  return (
    <PageTransition>
      <Layout>
        <section className="py-10 md:py-14">
          <div className="container">
            <Link
              to={`/cars/${car.country}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              К каталогу авто из {CAR_COUNTRY_LABELS[car.country]}
            </Link>

            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
              {/* Gallery */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="rounded-xl overflow-hidden border border-border/50 bg-secondary aspect-[4/3]">
                  {cover ? (
                    <img src={cover.url} alt={car.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      Нет фото
                    </div>
                  )}
                </div>
                {car.photos.length > 1 && (
                  <div className="mt-3 grid grid-cols-6 gap-2">
                    {car.photos.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => setActivePhoto(idx)}
                        className={`aspect-square rounded overflow-hidden border-2 transition ${
                          idx === activePhoto ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Details */}
              <div className="space-y-5">
                <div>
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    <span className="rounded bg-primary/90 px-2 py-0.5 text-primary-foreground">
                      {CAR_STATUS_LABELS[car.status]}
                    </span>
                    <span className="rounded border border-border px-2 py-0.5 text-muted-foreground">
                      {CAR_COUNTRY_LABELS[car.country]}
                    </span>
                  </div>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                    {car.brand} {car.model} {car.year}
                  </h1>
                  <div className="mt-3 text-3xl font-bold text-primary text-glow">
                    {formatPrice(car.price, car.currency)}
                  </div>
                </div>

                {specs.length > 0 && (
                  <div className="rounded-xl border border-border/50 bg-card p-4 grid grid-cols-2 gap-3">
                    {specs.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <s.icon className="h-4 w-4 text-primary shrink-0" />
                        <div className="text-sm">
                          <div className="text-xs text-muted-foreground">{s.label}</div>
                          <div className="font-medium text-foreground">{s.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {car.auction_sheet_url && (
                  <a
                    href={car.auction_sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" /> Аукционный лист
                  </a>
                )}

                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <h3 className="font-heading text-base font-bold text-foreground mb-3">
                    Заказать просчёт «под ключ во Владивостоке»
                  </h3>
                  <LeadForm
                    source={`car_card:${car.slug}`}
                    compact
                    buttonLabel="Получить расчёт"
                    defaultMessage={`Интересует: ${car.brand} ${car.model}${
                      car.year ? " " + car.year : ""
                    }. Прошу рассчитать стоимость под ключ во Владивостоке.`}
                  />
                </div>
              </div>
            </div>

            {car.description && (
              <div className="mt-10 max-w-3xl">
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">Описание</h2>
                <div className="rounded-xl border border-border/50 bg-card p-5 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {car.description}
                </div>
              </div>
            )}
          </div>
        </section>
      </Layout>
    </PageTransition>
  );
};

export default CarDetailPage;