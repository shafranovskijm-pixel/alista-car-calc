import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2 } from "lucide-react";

type Props = {
  dealId: string;
  stage: string;
  items: string[];
};

const StageChecklist = ({ dealId, stage, items }: Props) => {
  const key = `deal.checklist.${dealId}.${stage}`;
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(key);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setDone(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch {
      setDone(new Set());
    }
  }, [key]);

  const toggle = (item: string, v: boolean) => {
    setDone((prev) => {
      const n = new Set(prev);
      if (v) n.add(item);
      else n.delete(item);
      localStorage.setItem(key, JSON.stringify(Array.from(n)));
      return n;
    });
  };

  const doneCount = items.filter((i) => done.has(i)).length;
  const pct = items.length ? (doneCount / items.length) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Чек-лист этапа
          </span>
          <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
            {doneCount} / {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-1 rounded bg-muted overflow-hidden mb-2.5">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <ul className="space-y-1.5">
          {items.map((item) => {
            const checked = done.has(item);
            return (
              <li key={item} className="flex items-start gap-2 text-xs group">
                <Checkbox
                  id={`${key}-${item}`}
                  checked={checked}
                  onCheckedChange={(v) => toggle(item, !!v)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`${key}-${item}`}
                  className={`cursor-pointer select-none flex-1 ${
                    checked ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item}
                </label>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default StageChecklist;