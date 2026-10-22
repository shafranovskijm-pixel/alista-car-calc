import { useCatalogLiveRefresh } from "@/hooks/useCatalogLiveRefresh";
import { useEffect, useRef, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Car as CarIcon, Filter, Search } from "lucide-react";
import Layout from "@/components/Layout";
import PageTransition from "@/components/PageTransition";
import Seo from "@/components/Seo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fetchPublicCars, CAR_COUNTRY_LABELS, CAR_STATUS_LABELS, CAR_TRANSMISSION_LABELS, CAR_FUEL_LABELS, formatPrice, type CarCountry, type CarWithPhotos } from "@/lib/cars";
import { EMPTY_CATALOG_FILTERS, filterCatalogCars, readCatalogFilters, writeCatalogFilters, type CatalogFilters } from "@/lib/catalog-filters";
import { SEO_BY_PATH } from "@/lib/seo";
import { withRetry } from "@/lib/retry";
import { retryImageOnce } from "@/lib/image";

const countryFromSlug = (slug?: string): CarCountry | undefined =>
  slug === "japan" || slug === "korea" || slug === "china" ? slug : undefined;

const CAR_COUNTRY_GENITIVE_LABELS: Record<CarCountry, string> = { japan: "Японии", korea: "Кореи", china: "Китая" };

const FilterSelect = ({ id, label, value, onChange, options, allLabel }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  options: [string, string][]; allLabel?: string;
}) => (
  <div className="min-w-0">
    <Label htmlFor={id} className="mb-1.5 block text-xs">{label}</Label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {allLabel && <option value="all">{allLabel}</option>}
      {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select>
  </div>
);

const CarsPage = ({ countrySlug }: { countrySlug?: string }) => {
  const country = countryFromSlug(countrySlug);
  const seo = SEO_BY_PATH[country ? `/cars/${country}` : "/cars"];
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readCatalogFilters(params), [params]);
  const [cars, setCars] = useState<CarWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const hasDataRef = useRef(false);
  hasDataRef.current = cars.length > 0;
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!hasDataRef.current) setLoading(true);
    setFailed(false);
    withRetry(() => fetchPublicCars(country)).then((rows) => {
      if (!cancelled) setCars(rows.filter((car) => car.status !== "draft"));
    }).catch(() => {
      if (!cancelled) { if (!hasDataRef.current) setCars([]); if (!hasDataRef.current) setFailed(true); }
    }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [country, reloadKey]);

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

  const brands = useMemo(() => Array.from(new Set(cars.map((car) => car.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [cars]);
  const models = useMemo(() => Array.from(new Set(cars.filter((car) => filters.brand === "all" || car.brand === filters.brand).map((car) => car.model).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [cars, filters.brand]);
  const filtered = useMemo(() => filterCatalogCars(cars, { ...filters, country: country ?? filters.country }), [cars, filters, country]);
  const update = (key: keyof CatalogFilters, value: string) => {
    const next = { ...filters, [key]: value };
    if (key === "brand") next.model = "all";
    setParams(writeCatalogFilters(next), { replace: true });
  };
  const reset = () => setParams(writeCatalogFilters(EMPTY_CATALOG_FILTERS), { replace: true });
  const invalidRange = (filters.yearFrom && filters.yearTo && Number(filters.yearFrom) > Number(filters.yearTo)) || (filters.priceMin && filters.priceMax && Number(filters.priceMin) > Number(filters.priceMax));
  const advancedActive = ["model", "transmission", "fuel", "yearFrom", "yearTo", "priceMin"].some((key) => filters[key as keyof CatalogFilters] !== EMPTY_CATALOG_FILTERS[key as keyof CatalogFilters]);
  useEffect(() => { if (advancedActive) setAdvancedOpen(true); }, [advancedActive]);
  const countryParams = new URLSearchParams(params);
  countryParams.delete("country");
  const countrySearch = countryParams.toString() ? `?${countryParams.toString()}` : "";

  const rangeInput = (key: "yearFrom" | "yearTo" | "priceMin" | "priceMax", label: string, placeholder: string) => (
    <div className="min-w-0"><Label htmlFor={`catalog-${key}`} className="mb-1.5 block text-xs">{label}</Label><Input id={`catalog-${key}`} type="number" min="0" step="1" inputMode="numeric" value={filters[key]} onChange={(event) => update(key, event.target.value)} placeholder={placeholder} className="min-w-0" /></div>
  );

  return (
    <PageTransition><Layout>
      <Seo {...seo} robots={!loading && !failed && cars.length > 0 ? "index, follow" : "noindex, follow"} />
      <section className="py-12 md:py-16"><div className="container min-w-0">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-center font-heading text-3xl font-bold text-foreground md:text-4xl">{country ? `Авто из ${CAR_COUNTRY_GENITIVE_LABELS[country]}` : "Каталог автомобилей"}</h1>
          <p className="mt-3 text-center text-muted-foreground">Найдите автомобиль по марке, модели и параметрам. Здесь — все опубликованные автомобили ALISTA.</p>
        </motion.div>
        <div className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Каталоги по странам">
          <Link to={`/cars${countrySearch}`}><Button variant={!country ? "default" : "outline"} size="sm">Все страны</Button></Link>
          {(Object.keys(CAR_COUNTRY_LABELS) as CarCountry[]).map((key) => <Link key={key} to={`/cars/${key}${countrySearch}`}><Button variant={country === key ? "default" : "outline"} size="sm">{CAR_COUNTRY_LABELS[key]}</Button></Link>)}
        </div>

        <div className="mt-6 min-w-0 rounded-xl border border-border/50 bg-card/60 p-4 md:p-5">
          <Label htmlFor="catalog-search" className="mb-2 block font-semibold">Какой автомобиль ищете?</Label>
          <div className="relative min-w-0"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input id="catalog-search" type="search" value={filters.q} onChange={(event) => update("q", event.target.value)} placeholder="Например, Toyota C-HR или Тойота" className="min-w-0 pl-10" /></div>
          <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
            <FilterSelect id="catalog-brand" label="Марка" value={filters.brand} onChange={(value) => update("brand", value)} options={brands.map((brand) => [brand, brand])} allLabel="Все марки" />
            <FilterSelect id="catalog-status" label="Наличие" value={filters.status} onChange={(value) => update("status", value)} options={Object.entries(CAR_STATUS_LABELS).filter(([key]) => key !== "draft")} allLabel="Любое" />
            {!country ? <FilterSelect id="catalog-country" label="Страна" value={filters.country} onChange={(value) => update("country", value)} options={Object.entries(CAR_COUNTRY_LABELS)} allLabel="Все страны" /> : <FilterSelect id="catalog-model-basic" label="Модель" value={filters.model} onChange={(value) => update("model", value)} options={models.map((model) => [model, model])} allLabel="Все модели" />}
            {rangeInput("priceMax", "Цена до, ₽", "2 500 000")}
          </div>
          <details className="mt-4" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md py-2 text-sm font-medium text-primary"><Filter className="h-4 w-4" />Дополнительные фильтры</summary>
            <div className="mt-2 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
              {!country && <FilterSelect id="catalog-model" label="Модель" value={filters.model} onChange={(value) => update("model", value)} options={models.map((model) => [model, model])} allLabel="Все модели" />}
              <FilterSelect id="catalog-transmission" label="Коробка передач" value={filters.transmission} onChange={(value) => update("transmission", value)} options={Object.entries(CAR_TRANSMISSION_LABELS)} allLabel="Любая" />
              <FilterSelect id="catalog-fuel" label="Топливо" value={filters.fuel} onChange={(value) => update("fuel", value)} options={Object.entries(CAR_FUEL_LABELS)} allLabel="Любое" />
              {rangeInput("yearFrom", "Год от", "2018")}{rangeInput("yearTo", "Год до", "2026")}{rangeInput("priceMin", "Цена от, ₽", "1 000 000")}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Фильтр цены — только для стоимости в рублях. Авто без указанного года или цены не попадают в соответствующий диапазон.</p>
          </details>
          {invalidRange && <p role="alert" className="mt-3 text-sm text-destructive">Значение «от» не должно быть больше значения «до».</p>}
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border/50 pt-4">
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{loading ? "Загружаем автомобили…" : failed ? "Каталог недоступен" : `Найдено: ${filtered.length}`}</p>
            <div className="flex flex-wrap items-end gap-3"><FilterSelect id="catalog-sort" label="Сортировка" value={filters.sort} onChange={(value) => update("sort", value)} options={[["catalog", "Порядок каталога"], ["newest", "Сначала новые"], ["price_asc", "Сначала дешевле, ₽"], ["price_desc", "Сначала дороже, ₽"], ["year_desc", "Сначала новее по году"]]} /><Button variant="ghost" size="sm" onClick={reset}>Сбросить</Button></div>
          </div>
        </div>

        <div className="mt-8">
          {loading ? <div className="flex justify-center py-20"><Loader2 aria-label="Загрузка каталога" className="h-6 w-6 animate-spin text-primary" /></div> : failed ? (
            <div className="rounded-xl border border-dashed border-border/50 px-4 py-12 text-center text-muted-foreground"><CarIcon className="mx-auto mb-3 h-10 w-10" /><p>Не удалось загрузить каталог. Проверьте соединение и повторите попытку.</p><Button className="mt-5" onClick={() => setReloadKey((value) => value + 1)}>Повторить загрузку</Button></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 px-4 py-12 text-center text-muted-foreground"><CarIcon className="mx-auto mb-3 h-10 w-10" /><p>По вашему запросу ничего не найдено. Измените запрос или фильтры.</p><Button variant="outline" className="mt-4" onClick={reset}>Сбросить поиск и фильтры</Button></div>
          ) : <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((car) => {
            const cover = car.photos.find((photo) => photo.is_cover) ?? car.photos[0];
            return <Link key={car.id} to={`/cars/${car.slug}`} className="group min-w-0 overflow-hidden rounded-xl border border-border/50 bg-card hover-lift">
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary">{cover?.url ? <img src={cover.url} alt={car.title} onError={retryImageOnce} width={800} height={600} className="h-full w-full object-contain transition-transform group-hover:scale-[1.02]" loading="lazy" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Нет фото</div>}<span className="absolute left-2 top-2 rounded bg-primary/90 px-2 py-0.5 text-xs text-primary-foreground">{CAR_STATUS_LABELS[car.status]}</span><span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-xs">{CAR_COUNTRY_LABELS[car.country]}</span></div>
              <div className="space-y-1 p-4"><h2 className="break-words font-heading text-base font-semibold text-foreground">{car.title || `${car.brand} ${car.model}`}{car.year ? <span className="text-muted-foreground"> · {car.year}</span> : null}</h2><div className="text-xs text-muted-foreground">{[car.engine_volume != null && `${car.engine_volume} л`, car.transmission && CAR_TRANSMISSION_LABELS[car.transmission], car.mileage_km != null && `${new Intl.NumberFormat("ru-RU").format(car.mileage_km)} км`].filter(Boolean).join(" · ") || "—"}</div><div className="pt-2 text-lg font-bold text-primary">{formatPrice(car.price, car.currency)}</div></div>
            </Link>;
          })}</div>}
        </div>
      </div></section>
    </Layout></PageTransition>
  );
};

export default CarsPage;
