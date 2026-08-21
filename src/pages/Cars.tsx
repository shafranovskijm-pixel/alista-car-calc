import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Car as CarIcon, Filter } from "lucide-react";
import Layout from "@/components/Layout";
import PageTransition from "@/components/PageTransition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  fetchPublicCars,
  CAR_COUNTRY_LABELS,
  CAR_STATUS_LABELS,
  CAR_TRANSMISSION_LABELS,
  formatPrice,
  type CarCountry,
  type CarWithPhotos,
} from "@/lib/cars";

const countryFromSlug = (slug: string | undefined): CarCountry | undefined => {
  if (slug === "japan" || slug === "korea" || slug === "china") return slug;
  return undefined;
};

const CAR_COUNTRY_GENITIVE_LABELS: Record<CarCountry, string> = {
  japan: "Японии",
  korea: "Кореи",
  china: "Китая",
};

const titleFor = (country?: CarCountry) =>
  country ? `Авто из ${CAR_COUNTRY_GENITIVE_LABELS[country]}` : "Каталог авто";

const CarsPage = ({ countrySlug }: { countrySlug?: string }) => {
  const country = countryFromSlug(countrySlug);
  const [cars, setCars] = useState<CarWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [brand, setBrand] = useState<string>("all");
  const [transmission, setTransmission] = useState<string>("all");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPublicCars(country)
      .then((rows) => {
        if (!cancelled) setCars(rows);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [country]);

  const brands = useMemo(
    () => Array.from(new Set(cars.map((c) => c.brand))).sort(),
    [cars]
  );

  const filtered = useMemo(() => {
    return cars.filter((c) => {
      if (brand !== "all" && c.brand !== brand) return false;
      if (transmission !== "all" && c.transmission !== transmission) return false;
      if (yearFrom && (c.year ?? 0) < parseInt(yearFrom, 10)) return false;
      if (yearTo && (c.year ?? 9999) > parseInt(yearTo, 10)) return false;
      if (priceMax && (c.price ?? 0) > parseFloat(priceMax)) return false;
      return true;
    });
  }, [cars, brand, transmission, yearFrom, yearTo, priceMax]);

  const reset = () => {
    setBrand("all");
    setTransmission("all");
    setYearFrom("");
    setYearTo("");
    setPriceMax("");
  };

  return (
    <PageTransition>
      <Layout>
        <section className="py-12 md:py-16">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl text-center">
                {titleFor(country)}
              </h1>
              <p className="mt-3 text-center text-muted-foreground">
                Автомобили из опубликованного каталога. Используйте фильтры, чтобы подобрать подходящие параметры.
              </p>
            </motion.div>

            {/* Country tabs */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Link to="/cars">
                <Button variant={!country ? "default" : "outline"} size="sm">
                  Все
                </Button>
              </Link>
              {(["japan", "korea", "china"] as CarCountry[]).map((c) => (
                <Link key={c} to={`/cars/${c}`}>
                  <Button variant={country === c ? "default" : "outline"} size="sm">
                    {CAR_COUNTRY_LABELS[c]}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Filters */}
            <div className="mt-8 rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Filter className="h-4 w-4" />
                Фильтры
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <Label className="mb-1.5 block text-xs">Марка</Label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все марки</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">КПП</Label>
                  <Select value={transmission} onValueChange={setTransmission}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Любая</SelectItem>
                      {Object.entries(CAR_TRANSMISSION_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Год от</Label>
                  <Input
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="2018"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Год до</Label>
                  <Input
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder="2024"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Цена до (₽)</Label>
                  <Input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="2 500 000"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Найдено: {filtered.length}</span>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Сбросить
                </Button>
              </div>
            </div>

            {/* Grid */}
            <div className="mt-8">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 p-12 text-center text-muted-foreground">
                  <CarIcon className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                  Под текущие фильтры ничего не найдено. Попробуйте сбросить параметры.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((c) => {
                    const cover = c.photos.find((p) => p.is_cover) ?? c.photos[0];
                    return (
                      <Link
                        key={c.id}
                        to={`/cars/${c.slug}`}
                        className="group rounded-xl border border-border/50 bg-card overflow-hidden hover-lift"
                      >
                        <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                          {cover ? (
                            <img
                              src={cover.url}
                              alt={c.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              Нет фото
                            </div>
                          )}
                          <span className="absolute left-2 top-2 rounded bg-primary/90 px-2 py-0.5 text-xs text-primary-foreground">
                            {CAR_STATUS_LABELS[c.status]}
                          </span>
                          <span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-xs">
                            {CAR_COUNTRY_LABELS[c.country]}
                          </span>
                        </div>
                        <div className="p-4 space-y-1">
                          <div className="font-heading text-base font-semibold text-foreground line-clamp-1">
                            {c.brand} {c.model} {c.year && <span className="text-muted-foreground">{c.year}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {[
                              c.engine_volume && `${c.engine_volume} л`,
                              c.transmission && CAR_TRANSMISSION_LABELS[c.transmission],
                              c.mileage_km && `${new Intl.NumberFormat("ru-RU").format(c.mileage_km)} км`,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </div>
                          <div className="pt-2 text-lg font-bold text-primary">
                            {formatPrice(c.price, c.currency)}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </Layout>
    </PageTransition>
  );
};

export default CarsPage;
