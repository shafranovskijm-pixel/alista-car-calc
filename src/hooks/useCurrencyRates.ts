import { useState, useEffect } from "react";
import type { Currency } from "@/lib/calculator";

export interface CurrencyRates {
  rates: Record<Currency, number>;
  date: string;
  isLoading: boolean;
  isError: boolean;
}

const UNAVAILABLE_RATES: Record<Currency, number> = {
  RUB: 1,
  EUR: 0,
  USD: 0,
  JPY: 0,
};

export function useCurrencyRates(): CurrencyRates {
  const [rates, setRates] = useState<Record<Currency, number>>(UNAVAILABLE_RATES);
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // CBR XML daily rates API (uses CORS proxy via public mirror)
        const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        const usd = data.Valute?.USD?.Value;
        const eur = data.Valute?.EUR?.Value;
        const jpy = data.Valute?.JPY?.Value;
        const jpyNominal = data.Valute?.JPY?.Nominal || 100;

        if (!usd || !eur || !jpy) throw new Error("Missing currency data");

        const cbDate = new Date(data.Date);
        const formattedDate = cbDate.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        setRates({
          RUB: 1,
          USD: Math.round(usd * 100) / 100,
          EUR: Math.round(eur * 100) / 100,
          JPY: Math.round((jpy / jpyNominal) * 100) / 100,
        });
        setDate(formattedDate);
        setIsError(false);
      } catch {
        setIsError(true);
        setRates(UNAVAILABLE_RATES);
        setDate("");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, []);

  return { rates, date, isLoading, isError };
}
