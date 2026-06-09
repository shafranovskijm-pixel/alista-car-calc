import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calculator } from "lucide-react";

type Props = {
  dealId: string;
  currency: string;
  initial: {
    sale_price: number | null;
    purchase_cost: number | null;
    customs_cost: number | null;
    logistics_cost: number | null;
    other_cost: number | null;
    margin: number | null;
  };
  onSaved?: () => void;
};

const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\s/g, "").replace(",", ".")));
const fmt = (n: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);

const MarginCalculator = ({ dealId, currency, initial, onSaved }: Props) => {
  const [sale, setSale] = useState(initial.sale_price?.toString() ?? "");
  const [purchase, setPurchase] = useState(initial.purchase_cost?.toString() ?? "");
  const [customs, setCustoms] = useState(initial.customs_cost?.toString() ?? "");
  const [logistics, setLogistics] = useState(initial.logistics_cost?.toString() ?? "");
  const [other, setOther] = useState(initial.other_cost?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSale(initial.sale_price?.toString() ?? "");
    setPurchase(initial.purchase_cost?.toString() ?? "");
    setCustoms(initial.customs_cost?.toString() ?? "");
    setLogistics(initial.logistics_cost?.toString() ?? "");
    setOther(initial.other_cost?.toString() ?? "");
  }, [dealId]); // eslint-disable-line react-hooks/exhaustive-deps

  const calc = useMemo(() => {
    const s = Number(num(sale) ?? 0);
    const p = Number(num(purchase) ?? 0);
    const c = Number(num(customs) ?? 0);
    const l = Number(num(logistics) ?? 0);
    const o = Number(num(other) ?? 0);
    const costs = p + c + l + o;
    const margin = s - costs;
    const marginPct = s > 0 ? (margin / s) * 100 : 0;
    const markupPct = costs > 0 ? (margin / costs) * 100 : 0;
    return { costs, margin, marginPct, markupPct, hasData: s > 0 || costs > 0 };
  }, [sale, purchase, customs, logistics, other]);

  const save = async () => {
    setSaving(true);
    const patch = {
      sale_price: num(sale),
      purchase_cost: num(purchase),
      customs_cost: num(customs),
      logistics_cost: num(logistics),
      other_cost: num(other),
      margin: calc.hasData ? calc.margin : null,
    };
    const { error } = await supabase.from("deals").update(patch).eq("id", dealId);
    setSaving(false);
    if (error) {
      toast.error("Не удалось сохранить");
    } else {
      toast.success("Расчёт сохранён");
      onSaved?.();
    }
  };

  const marginTone =
    calc.margin > 0 ? "text-emerald-400" : calc.margin < 0 ? "text-rose-400" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Расчёт прибыли
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Цена продажи" value={sale} onChange={setSale} accent="primary" />
          <Field label="Закуп авто" value={purchase} onChange={setPurchase} />
          <Field label="Таможня" value={customs} onChange={setCustoms} />
          <Field label="Логистика" value={logistics} onChange={setLogistics} />
          <Field label="Прочее" value={other} onChange={setOther} />
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1 text-xs">
          <Row k="Расходы" v={`${fmt(calc.costs)} ${currency}`} />
          <Row
            k="Маржа"
            v={
              <span className={`font-semibold tabular-nums ${marginTone}`}>
                {fmt(calc.margin)} {currency}
              </span>
            }
          />
          {calc.hasData && (
            <Row
              k="% маржи / наценки"
              v={
                <span className={`tabular-nums ${marginTone}`}>
                  {calc.marginPct.toFixed(1)}% / {calc.markupPct.toFixed(1)}%
                </span>
              }
            />
          )}
        </div>

        <Button size="sm" onClick={save} disabled={saving} className="w-full">
          {saving ? "Сохранение..." : "Сохранить расчёт"}
        </Button>
      </CardContent>
    </Card>
  );
};

const Field = ({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent?: "primary";
}) => (
  <div>
    <label className="text-[11px] text-muted-foreground">{label}</label>
    <Input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
      className={`h-8 text-sm ${accent === "primary" ? "border-primary/50 focus-visible:ring-primary" : ""}`}
    />
  </div>
);

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{k}</span>
    <span>{v}</span>
  </div>
);

export default MarginCalculator;