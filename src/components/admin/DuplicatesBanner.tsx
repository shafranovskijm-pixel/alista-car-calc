import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/proxy-client";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type DupGroup = {
  key: string;
  field: "phone" | "email";
  value: string;
  ids: { id: string; full_name: string }[];
};

const norm = (v: string | null) => (v ?? "").replace(/\D/g, "");

const DuplicatesBanner = () => {
  const [groups, setGroups] = useState<DupGroup[]>([]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, full_name, phone, email")
        .limit(2000);
      const list = (data ?? []) as { id: string; full_name: string; phone: string | null; email: string | null }[];
      const byPhone = new Map<string, { id: string; full_name: string }[]>();
      const byEmail = new Map<string, { id: string; full_name: string }[]>();
      list.forEach((c) => {
        const p = norm(c.phone);
        if (p.length >= 10) {
          if (!byPhone.has(p)) byPhone.set(p, []);
          byPhone.get(p)!.push({ id: c.id, full_name: c.full_name });
        }
        const e = (c.email ?? "").trim().toLowerCase();
        if (e) {
          if (!byEmail.has(e)) byEmail.set(e, []);
          byEmail.get(e)!.push({ id: c.id, full_name: c.full_name });
        }
      });
      const result: DupGroup[] = [];
      byPhone.forEach((ids, value) => {
        if (ids.length > 1) result.push({ key: `p:${value}`, field: "phone", value, ids });
      });
      byEmail.forEach((ids, value) => {
        if (ids.length > 1) result.push({ key: `e:${value}`, field: "email", value, ids });
      });
      setGroups(result);
    })();
  }, []);

  if (hidden || groups.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm flex gap-3">
      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-medium mb-1">
          Найдено возможных дубликатов: {groups.length}
        </div>
        <ul className="space-y-1 max-h-32 overflow-auto">
          {groups.slice(0, 6).map((g) => (
            <li key={g.key} className="text-xs text-muted-foreground">
              <span className="font-mono">{g.field === "phone" ? `+${g.value}` : g.value}</span>:{" "}
              {g.ids.map((c, i) => (
                <span key={c.id}>
                  <Link to={`/admin/clients/${c.id}`} className="text-foreground hover:underline">
                    {c.full_name}
                  </Link>
                  {i < g.ids.length - 1 ? ", " : ""}
                </span>
              ))}
            </li>
          ))}
          {groups.length > 6 && (
            <li className="text-xs text-muted-foreground">…и ещё {groups.length - 6}</li>
          )}
        </ul>
      </div>
      <Button variant="ghost" size="icon" onClick={() => setHidden(true)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DuplicatesBanner;