import { useCurrencyRates } from "@/hooks/useCurrencyRates";

export const CurrencyTicker = () => {
  const { rates, isLoading } = useCurrencyRates();
  if (isLoading) return null;
  const fmt = (n: number) => n.toFixed(2);
  return (
    <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1"><span className="text-muted-foreground/70">USD</span><span className="text-foreground font-medium">{fmt(rates.USD)}</span></span>
      <span className="flex items-center gap-1"><span className="text-muted-foreground/70">EUR</span><span className="text-foreground font-medium">{fmt(rates.EUR)}</span></span>
      <span className="flex items-center gap-1"><span className="text-muted-foreground/70">JPY</span><span className="text-foreground font-medium">{fmt(rates.JPY)}</span></span>
    </div>
  );
};

export default CurrencyTicker;