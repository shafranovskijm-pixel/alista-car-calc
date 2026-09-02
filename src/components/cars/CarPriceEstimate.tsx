import { Link } from "react-router-dom";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import type { CarWithPhotos } from "@/lib/cars";

export type CarPriceEstimateProps = {
  car: CarWithPhotos;
};

const CarPriceEstimate = ({ car }: CarPriceEstimateProps) => (
  <div className="rounded-xl border border-primary/25 bg-card p-5">
    <div className="flex items-center gap-2">
      <ClipboardCheck className="h-4 w-4 text-primary" />
      <h3 className="font-heading text-base font-bold text-foreground">
        Запросить расчёт платежей
      </h3>
    </div>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
      Передайте параметры {car.brand} {car.model}. Специалист проверит актуальные правила, курс и формат ввоза, затем уточнит состав платежей.
    </p>
    <Link
      to="/contacts"
      className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
    >
      Запросить расчёт
      <ArrowRight className="h-4 w-4" />
    </Link>
  </div>
);

export default CarPriceEstimate;
