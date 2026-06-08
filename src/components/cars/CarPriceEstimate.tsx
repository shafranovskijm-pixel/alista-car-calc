import { useMemo, useState } from "react";
import { Calculator as CalcIcon, ChevronDown, ChevronUp } from "lucide-react";
import {
  calculate,
  DEFAULT_RATES,
  type AgeCategory,
  type CalcInput,
  type Currency,
  type FuelType,
} from "@/lib/calculator";
import type { CarWithPhotos } from "@/lib/cars";

const VLADIVOSTOK_DELIVERY_RUB = 120000;
const BROKER_FEE_RUB = 60000;

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n) + " ₽";

const ageFromYear = (year: number | null | undefined): AgeCategory => {
  if (!year) return "3-5";
  const age = new Date().getFullYear() - year;
  if (age < 1) return "new";
  if (age <= 3) return "1-3";
  if (age <= 5) return "3-5";
  if (age <= 7) return "5-7";
  return "7+";
};

const mapFuel = (fuel: string | null | undefined): FuelType => {
  if (fuel === "diesel") return "diesel";
  if (fuel === "electric") return "electric";
  if (fuel === "hybrid") return "hybrid";
  return "petrol";
};

const mapCurrency = (cur: string): Currency => {
  if (cur === "EUR" || cur === "USD" || cur === "JPY" || cur === "RUB") return cur;
  return "USD";
};

export type CarPriceEstimateProps = {
  car: CarWithPhotos;
  onSnapshotChange?: (snapshot: Record<string, unknown> | null) => void;
};

const CarPriceEstimate = ({ car, onSnapshotChange }: CarPriceEstimateProps) => {
  const [expanded, setExpanded] = useState(false);

  const { result, snapshot, ready } = useMemo(() => {
    if (!car.price || !car.engine_volume) {
      onSnapshotChange?.(null);
      return { result: null, snapshot: null, ready: false };
    }
    const input: CalcInput = {
      vehicleType: "car",
      price: car.price,
      currency: mapCurrency(car.currency),
      engineVolume: Math.round((car.engine_volume ?? 0) * 1000),
      power: car.power_hp ?? 150,
      fuelType: mapFuel(car.fuel),
      age: ageFromYear(car.year),
      importerType: "individual",
      mass: 1500,
    };
    const calc = calculate(input, DEFAULT_RATES);
    const carPriceRub = input.price * DEFAULT_RATES[input.currency];
    const total =
      calc.total + carPriceRub + VLADIVOSTOK_DELIVERY_RUB + BROKER_FEE_RUB;
    const snap = {
      car_id: car.id,
      car: `${car.brand} ${car.model} ${car.year ?? ""}`.trim(),
      input,
      result: calc,
      car_price_rub: Math.round(carPriceRub),
      delivery_vladivostok_rub: VLADIVOSTOK_DELIVERY_RUB,
      broker_fee_rub: BROKER_FEE_RUB,
      total_rub: Math.round(total),
      rates: DEFAULT_RATES,
    };
    onSnapshotChange?.(snap);
    return { result: { ...calc, carPriceRub, total }, snapshot: snap, ready: true };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car.id]);

  if (!ready || !result) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">
        Для предварительного расчёта нужны цена и объём двигателя — менеджер уточнит детали.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <CalcIcon className="h-4 w-4 text-primary" />
        <h3 className="font-heading text-base font-bold text-foreground">
          Под ключ во Владивостоке (ориентир)
        </h3>
      </div>
      <div className="text-2xl font-bold text-primary text-glow">
        ≈ {fmt(result.total)}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Расчёт для физлица по курсам ЦБ. Итог уточняет менеджер.
      </p>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Скрыть детализацию" : "Показать детализацию"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-1 text-sm border-t border-border/50 pt-3">
          <Row label="Стоимость авто (в рублях)" value={result.carPriceRub} />
          <Row label="Таможенная пошлина" value={result.customsDuty} />
          {result.excise > 0 && <Row label="Акциз" value={result.excise} />}
          {result.vat > 0 && <Row label="НДС" value={result.vat} />}
          <Row label="Утилизационный сбор" value={result.recyclingFee} />
          <Row label="Таможенный сбор" value={result.customsFee} />
          <Row label="Доставка до Владивостока" value={VLADIVOSTOK_DELIVERY_RUB} />
          <Row label="Услуги брокера" value={BROKER_FEE_RUB} />
          <div className="flex justify-between pt-2 mt-2 border-t border-border/50 font-semibold text-foreground">
            <span>Итого</span>
            <span>{fmt(result.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between text-muted-foreground">
    <span>{label}</span>
    <span className="text-foreground">{fmt(value)}</span>
  </div>
);

export default CarPriceEstimate;