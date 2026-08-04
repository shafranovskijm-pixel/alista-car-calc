import { OfferItem, money } from "@/lib/offers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Save } from "lucide-react";

type DraftItem = Pick<OfferItem, "name" | "description" | "unit" | "qty" | "price"> & {
  id?: string;
  service_id?: string | null;
  catalog_price?: number | null;
};

type Props = {
  items: DraftItem[];
  currency: string;
  onChange: (items: DraftItem[]) => void;
  /** Запомнить цену позиции в каталоге услуг */
  onRememberPrice?: (serviceId: string, price: number) => void;
};

const OfferItemsTable = ({ items, currency, onChange, onRememberPrice }: Props) => {
  const update = (i: number, patch: Partial<DraftItem>) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));

  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Пока пусто. Выберите услуги слева или добавьте свою.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2 bg-card">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground mt-2 hidden sm:block" />
            <div className="flex-1 space-y-2">
              <Input
                value={it.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Название услуги"
                className="font-medium"
              />
              <Input
                value={it.description ?? ""}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder="Комментарий (не обязательно)"
                className="text-xs"
              />
              <div className="grid grid-cols-4 gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={it.qty}
                  onChange={(e) => update(i, { qty: parseFloat(e.target.value) || 0 })}
                  placeholder="Кол-во"
                />
                <Input
                  value={it.unit}
                  onChange={(e) => update(i, { unit: e.target.value })}
                  placeholder="Ед."
                />
                <Input
                  type="number"
                  step="0.01"
                  value={it.price}
                  onChange={(e) => update(i, { price: parseFloat(e.target.value) || 0 })}
                  placeholder="Цена"
                />
                <div className="flex items-center justify-end px-2 text-sm font-semibold">
                  {money(Number(it.qty) * Number(it.price), currency)}
                </div>
              </div>
              {it.service_id && onRememberPrice && Number(it.price) !== Number(it.catalog_price ?? NaN) && (
                <div className="flex items-center justify-between gap-2 rounded-md bg-primary/5 border border-primary/20 px-2.5 py-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    Цена отличается от каталога{it.catalog_price != null ? ` (${money(Number(it.catalog_price), currency)})` : ""}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[11px] gap-1"
                    onClick={() => onRememberPrice(it.service_id!, Number(it.price))}
                  >
                    <Save className="h-3 w-3" /> Запомнить цену
                  </Button>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(i)} title="Удалить">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OfferItemsTable;