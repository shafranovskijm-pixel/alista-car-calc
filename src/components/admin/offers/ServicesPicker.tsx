import { useMemo, useState } from "react";
import { CATEGORY_LABEL, Service } from "@/lib/offers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

type Props = {
  services: Service[];
  onAdd: (svc: Service) => void;
  onAddCustom: () => void;
};

const ServicesPicker = ({ services, onAdd, onAddCustom }: Props) => {
  const [q, setQ] = useState("");
  const grouped = useMemo(() => {
    const filtered = q
      ? services.filter((s) => (s.name + " " + (s.description ?? "")).toLowerCase().includes(q.toLowerCase()))
      : services;
    const map = new Map<string, Service[]>();
    for (const s of filtered) {
      const k = s.category || "other";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    return Array.from(map.entries());
  }, [services, q]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск услуги" className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={onAddCustom}>
          <Plus className="h-4 w-4 mr-1" /> Своя
        </Button>
      </div>
      <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
        {grouped.map(([cat, list]) => (
          <div key={cat}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              {CATEGORY_LABEL[cat] ?? cat}
            </div>
            <div className="space-y-1.5">
              {list.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onAdd(s)}
                  className="w-full text-left rounded-md border border-border/60 hover:border-primary/50 hover:bg-primary/5 p-2.5 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      {s.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{s.description}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold">{s.base_price.toLocaleString("ru-RU")} ₽</div>
                      <div className="text-[10px] text-muted-foreground">/ {s.unit}</div>
                    </div>
                    <Plus className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-6">Ничего не найдено</div>
        )}
      </div>
    </div>
  );
};

export default ServicesPicker;