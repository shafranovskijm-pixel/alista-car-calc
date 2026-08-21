import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator as CalcIcon, Send, RefreshCw } from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Layout from "@/components/Layout";
import LeadForm from "@/components/LeadForm";
import {
  calculate,
  vehicleTypeLabels,
  fuelTypeLabels,
  ageCategoryLabels,
  currencyLabels,
  type CalcInput,
  type CalcResult,
  type VehicleType,
  type Currency,
  type FuelType,
  type AgeCategory,
  type ImporterType,
} from "@/lib/calculator";
import { useCurrencyRates } from "@/hooks/useCurrencyRates";

const formatNum = (n: number) => n.toLocaleString("ru-RU");

const CalculatorPage = () => {
  const { rates, date: ratesDate, isLoading: ratesLoading, isError: ratesError } = useCurrencyRates();

  const [form, setForm] = useState<CalcInput>({
    vehicleType: "car",
    price: 0,
    currency: "USD",
    engineVolume: 2000,
    power: 150,
    fuelType: "petrol",
    age: "3-5",
    importerType: "individual",
    mass: 1500,
  });

  const [result, setResult] = useState<CalcResult | null>(null);
  const ratesUnavailable = ratesError && form.currency !== "RUB";

  const handleCalc = () => {
    if (form.price <= 0 || ratesLoading || ratesUnavailable) return;
    setResult(calculate(form, rates));
  };

  const update = <K extends keyof CalcInput>(key: K, val: CalcInput[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  return (
    <PageTransition>
      <Layout>
        <section className="py-12 md:py-20">
          <div className="container max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl text-center">
              <CalcIcon className="mr-3 inline h-8 w-8 text-primary" />
              Таможенный калькулятор
            </h1>
            <p className="mt-3 text-center text-muted-foreground">
              Рассчитайте предварительную стоимость платежей для выбранного типа транспортного средства
            </p>

            {/* Live rates banner */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 rounded-lg border border-border/50 bg-card px-4 py-2.5 text-sm">
              {ratesLoading ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Загрузка курсов валют…
                </span>
              ) : ratesError ? (
                <span className="text-center text-destructive">
                  Курсы валют сейчас недоступны. Расчёт в иностранной валюте временно отключён.
                </span>
              ) : (
                <>
                  <span className="text-muted-foreground">
                    Курсы валют на {ratesDate}:
                  </span>
                  <span className="font-medium text-foreground">$ {rates.USD}</span>
                  <span className="font-medium text-foreground">€ {rates.EUR}</span>
                  <span className="font-medium text-foreground">¥ {rates.JPY}</span>
                </>
              )}
            </div>
          </motion.div>

          <div className="mt-10 grid gap-8 lg:grid-cols-5">
            {/* Form */}
            <div className="space-y-6 lg:col-span-3">
              <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5">
                {/* Importer type */}
                <div>
                  <Label className="text-foreground font-semibold mb-3 block">Кто ввозит</Label>
                  <RadioGroup
                    value={form.importerType}
                    onValueChange={(v) => update("importerType", v as ImporterType)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="cursor-pointer">Физлицо</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="legal" id="legal" />
                      <Label htmlFor="legal" className="cursor-pointer">Юрлицо</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Vehicle type */}
                <div>
                  <Label className="text-foreground font-semibold mb-2 block">Тип ТС</Label>
                  <Select value={form.vehicleType} onValueChange={(v) => update("vehicleType", v as VehicleType)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(vehicleTypeLabels) as [VehicleType, string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price + Currency */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-foreground font-semibold mb-2 block">Стоимость</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.price || ""}
                      onChange={(e) => update("price", Number(e.target.value))}
                      placeholder="Введите стоимость"
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground font-semibold mb-2 block">Валюта</Label>
                    <Select value={form.currency} onValueChange={(v) => update("currency", v as Currency)}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(currencyLabels) as [Currency, string][]).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Engine, Power */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-foreground font-semibold mb-2 block">Объём двигателя (см³)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.engineVolume || ""}
                      onChange={(e) => update("engineVolume", Number(e.target.value))}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground font-semibold mb-2 block">Мощность (л.с.)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.power || ""}
                      onChange={(e) => update("power", Number(e.target.value))}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                {/* Fuel, Age */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-foreground font-semibold mb-2 block">Тип двигателя</Label>
                    <Select value={form.fuelType} onValueChange={(v) => update("fuelType", v as FuelType)}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(fuelTypeLabels) as [FuelType, string][]).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground font-semibold mb-2 block">Возраст авто</Label>
                    <Select value={form.age} onValueChange={(v) => update("age", v as AgeCategory)}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(ageCategoryLabels) as [AgeCategory, string][]).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Mass */}
                <div>
                  <Label className="text-foreground font-semibold mb-2 block">Масса (кг)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.mass || ""}
                    onChange={(e) => update("mass", Number(e.target.value))}
                    className="bg-secondary border-border"
                  />
                </div>

                <Button
                  onClick={handleCalc}
                  size="lg"
                  className="w-full gradient-accent text-base font-semibold text-primary-foreground hover:opacity-90"
                  disabled={form.price <= 0 || ratesLoading || ratesUnavailable}
                >
                  <CalcIcon className="mr-2 h-5 w-5" />
                  {ratesUnavailable ? "Курсы недоступны" : "Рассчитать"}
                </Button>
              </div>
            </div>

            {/* Result */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-xl border border-border/50 bg-card p-6">
                <h2 className="font-heading text-lg font-bold text-foreground mb-4">Результат расчёта</h2>

                {result ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <Row label="Таможенная пошлина" value={result.customsDuty} />
                    <Row label="Акциз" value={result.excise} />
                    <Row label="НДС" value={result.vat} />
                    <Row label="Утилизационный сбор" value={result.recyclingFee} />
                    <Row label="Таможенный сбор" value={result.customsFee} />
                    <div className="border-t border-border/50 pt-3 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-foreground">Итого</span>
                        <AnimatedCounter value={result.total} suffix=" ₽" className="text-xl font-bold text-primary text-glow" />
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        * Расчёт является предварительным. Для уточнения суммы отправьте параметры менеджеру.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ** Дата загруженных курсов: {ratesDate || "не требуется для RUB"}.
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/79140730196?text=${encodeURIComponent(
                        `Здравствуйте! Прошу проверить исходные данные и уточнить сумму таможенных платежей. Предварительный итог: ${formatNum(result.total)} ₽`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="mt-4 w-full" variant="outline">
                        <Send className="mr-2 h-4 w-4" />
                        Оставить заявку в WhatsApp
                      </Button>
                    </a>

                    <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-semibold text-foreground mb-3">
                        Нужна проверка менеджером?
                      </p>
                      <LeadForm
                        source="calculator"
                        compact
                        buttonLabel="Уточнить у менеджера"
                        defaultMessage={`Расчёт калькулятора: ${formatNum(result.total)} ₽. Прошу проверить исходные данные и уточнить сумму.`}
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Заполните параметры и нажмите «Рассчитать», чтобы увидеть результат.
                    </p>
                    <div className="space-y-3 rounded-lg border border-dashed border-border/50 bg-secondary/30 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Что появится в результате
                      </p>
                      <ul className="space-y-2 text-sm text-foreground">
                        <li>Таможенная пошлина и сбор</li>
                        <li>Акциз и НДС — когда применимы</li>
                        <li>Утилизационный сбор</li>
                        <li>Общая предварительная сумма</li>
                      </ul>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Итог калькулятора носит предварительный характер. Уточнённую сумму подтвердит специалист после проверки исходных данных.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <section className="mt-10 rounded-xl border border-border/60 bg-card p-5 text-sm leading-relaxed text-muted-foreground">
            <h2 className="font-heading text-base font-bold text-foreground">Перед оформлением</h2>
            <p className="mt-2">
              Ставки, коэффициенты и требования могут меняться. Используйте онлайн-результат как предварительную оценку; перед оформлением специалист проверит исходные данные и правила, действующие на дату расчёта.
            </p>
          </section>
        </div>
      </section>
    </Layout>
    </PageTransition>
  );
};

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <AnimatedCounter value={value} suffix=" ₽" className="font-medium text-foreground" />
  </div>
);

export default CalculatorPage;
