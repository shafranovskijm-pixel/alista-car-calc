import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Inbox, Users, Briefcase, Car } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/proxy-client";

type Result = {
  id: string;
  label: string;
  sub?: string;
  type: "lead" | "client" | "deal" | "car";
};

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const like = `%${q}%`;
      const [leads, clients, deals, cars] = await Promise.all([
        supabase.from("leads").select("id, full_name, phone, status").or(`full_name.ilike.${like},phone.ilike.${like},email.ilike.${like}`).limit(5),
        supabase.from("clients").select("id, full_name, phone").or(`full_name.ilike.${like},phone.ilike.${like}`).limit(5),
        supabase.from("deals").select("id, title, stage").ilike("title", like).limit(5),
        supabase.from("cars").select("id, slug, brand, model").or(`brand.ilike.${like},model.ilike.${like}`).limit(5),
      ]);
      const out: Result[] = [];
      (leads.data ?? []).forEach((r: any) => out.push({ id: r.id, label: r.full_name, sub: r.phone, type: "lead" }));
      (clients.data ?? []).forEach((r: any) => out.push({ id: r.id, label: r.full_name, sub: r.phone ?? "", type: "client" }));
      (deals.data ?? []).forEach((r: any) => out.push({ id: r.id, label: r.title, sub: r.stage, type: "deal" }));
      (cars.data ?? []).forEach((r: any) => out.push({ id: r.slug ?? r.id, label: `${r.brand} ${r.model}`, type: "car" }));
      setResults(out);
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  const go = (r: Result) => {
    setOpen(false);
    setQuery("");
    if (r.type === "lead") navigate(`/admin/leads/${r.id}`);
    else if (r.type === "client") navigate(`/admin/clients/${r.id}`);
    else if (r.type === "deal") navigate(`/admin/deals/${r.id}`);
    else if (r.type === "car") navigate(`/admin/cars/${r.id}`);
  };

  const grouped = {
    lead: results.filter((r) => r.type === "lead"),
    client: results.filter((r) => r.type === "client"),
    deal: results.filter((r) => r.type === "deal"),
    car: results.filter((r) => r.type === "car"),
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/70 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Поиск...</span>
        <kbd className="ml-1 hidden sm:inline rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput value={query} onValueChange={setQuery} placeholder="Поиск по заявкам, клиентам, сделкам, авто..." />
        <CommandList>
          <CommandEmpty>{query ? "Ничего не найдено" : "Введите запрос..."}</CommandEmpty>
          {grouped.lead.length > 0 && (
            <CommandGroup heading="Заявки">
              {grouped.lead.map((r) => (
                <CommandItem key={`lead-${r.id}`} onSelect={() => go(r)}>
                  <Inbox className="mr-2 h-4 w-4" />
                  <span>{r.label}</span>
                  {r.sub && <span className="ml-auto text-xs text-muted-foreground">{r.sub}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {grouped.client.length > 0 && (
            <CommandGroup heading="Клиенты">
              {grouped.client.map((r) => (
                <CommandItem key={`client-${r.id}`} onSelect={() => go(r)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{r.label}</span>
                  {r.sub && <span className="ml-auto text-xs text-muted-foreground">{r.sub}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {grouped.deal.length > 0 && (
            <CommandGroup heading="Сделки">
              {grouped.deal.map((r) => (
                <CommandItem key={`deal-${r.id}`} onSelect={() => go(r)}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  <span>{r.label}</span>
                  {r.sub && <span className="ml-auto text-xs text-muted-foreground">{r.sub}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {grouped.car.length > 0 && (
            <CommandGroup heading="Авто">
              {grouped.car.map((r) => (
                <CommandItem key={`car-${r.id}`} onSelect={() => go(r)}>
                  <Car className="mr-2 h-4 w-4" />
                  <span>{r.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;