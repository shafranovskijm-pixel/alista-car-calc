import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Car as CarIcon, Link2, Unlink, Search } from "lucide-react";
import { toast } from "sonner";

type CarRow = {
  id: string;
  title: string;
  brand: string | null;
  model: string | null;
  slug: string | null;
  status: string | null;
  deal_id: string | null;
};

const DealCarLink = ({ dealId }: { dealId: string }) => {
  const [linked, setLinked] = useState<CarRow | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CarRow[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("cars")
      .select("id, title, brand, model, slug, status, deal_id")
      .eq("deal_id", dealId)
      .maybeSingle();
    setLinked((data as CarRow) ?? null);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      let q = supabase
        .from("cars")
        .select("id, title, brand, model, slug, status, deal_id")
        .is("deal_id", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data } = await q;
      setResults((data as CarRow[]) ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [search, open]);

  const attach = async (carId: string) => {
    const { error } = await supabase.from("cars").update({ deal_id: dealId }).eq("id", carId);
    if (error) toast.error(error.message);
    else {
      toast.success("Авто привязано к сделке");
      setOpen(false);
      load();
    }
  };

  const detach = async () => {
    if (!linked) return;
    const { error } = await supabase.from("cars").update({ deal_id: null }).eq("id", linked.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Авто отвязано");
      load();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CarIcon className="h-3.5 w-3.5" /> Привязанное авто
        </CardTitle>
      </CardHeader>
      <CardContent>
        {linked ? (
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <Link
                to={`/admin/cars/${linked.id}`}
                className="text-sm font-medium hover:underline line-clamp-2"
              >
                {linked.title}
              </Link>
              <div className="text-xs text-muted-foreground mt-0.5">
                {linked.brand} {linked.model}
                {linked.status && <span className="ml-2">· {linked.status}</span>}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={detach} title="Отвязать">
              <Unlink className="h-3.5 w-3.5 text-red-400" />
            </Button>
          </div>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="w-full">
                <Link2 className="h-3.5 w-3.5 mr-1" /> Привязать авто
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Выбрать авто из каталога</DialogTitle>
              </DialogHeader>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-7"
                  placeholder="Поиск по названию..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <ul className="max-h-80 overflow-auto divide-y divide-border -mx-6">
                {results.length === 0 ? (
                  <li className="px-6 py-4 text-sm text-muted-foreground">Ничего не найдено</li>
                ) : (
                  results.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => attach(c.id)}
                        className="w-full text-left px-6 py-2.5 hover:bg-muted/40 transition-colors"
                      >
                        <div className="text-sm font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.brand} {c.model} {c.status && `· ${c.status}`}
                        </div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default DealCarLink;