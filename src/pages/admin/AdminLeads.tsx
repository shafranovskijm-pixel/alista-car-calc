import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpDown,
  Columns3,
  Filter,
  Inbox,
  LayoutGrid,
  MoreHorizontal,
  Search,
  Table as TableIcon,
  UserPlus,
  X,
} from "lucide-react";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LeadStatus } from "@/lib/leads";
import EmptyState from "@/components/admin/EmptyState";
import { KanbanBoard, KanbanColumn } from "@/components/admin/KanbanBoard";

type Lead = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  status: LeadStatus;
  source: string | null;
  utm_source: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type SortKey = "created_at" | "updated_at" | "full_name" | "status";
type ColKey = "client" | "phone" | "email" | "status" | "source" | "sla" | "created";

const ALL_COLS: { key: ColKey; label: string }[] = [
  { key: "client", label: "Клиент" },
  { key: "phone", label: "Телефон" },
  { key: "email", label: "Email" },
  { key: "status", label: "Статус" },
  { key: "source", label: "Источник" },
  { key: "sla", label: "SLA" },
  { key: "created", label: "Создана" },
];

const STATUS_DOT: Record<LeadStatus, string> = {
  new: "bg-primary",
  in_progress: "bg-sky-400",
  callback: "bg-amber-400",
  meeting: "bg-violet-400",
  contract: "bg-indigo-400",
  awaiting_payment: "bg-yellow-400",
  in_transit: "bg-cyan-400",
  delivered: "bg-teal-400",
  won: "bg-emerald-400",
  lost: "bg-rose-400",
};

const PREFS_KEY = "admin.leads.prefs.v1";

type Prefs = {
  cols: ColKey[];
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  status: string;
  source: string;
};

const DEFAULT_PREFS: Prefs = {
  cols: ["client", "phone", "status", "source", "sla", "created"],
  sortKey: "created_at",
  sortDir: "desc",
  status: "all",
  source: "all",
};

const hoursSince = (iso: string) => (Date.now() - new Date(iso).getTime()) / 36e5;

function slaTone(l: Lead): { color: string; label: string } {
  if (["won", "lost", "delivered"].includes(l.status)) return { color: "bg-muted-foreground/30", label: "—" };
  const h = hoursSince(l.updated_at);
  if (h < 12) return { color: "bg-emerald-400", label: `${Math.round(h)}ч` };
  if (h < 48) return { color: "bg-amber-400", label: `${Math.round(h)}ч` };
  return { color: "bg-rose-400", label: h >= 48 ? `${Math.round(h / 24)}д` : `${Math.round(h)}ч` };
}

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<number>(-1);
  const [me, setMe] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<"table" | "board">(
    () => (localStorage.getItem("admin.leads.view") as "table" | "board") || "table",
  );
  useEffect(() => {
    localStorage.setItem("admin.leads.view", view);
  }, [view]);

  const [prefs, setPrefs] = useState<Prefs>(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  });

  // sync ?status= from URL once
  useEffect(() => {
    const urlStatus = params.get("status");
    if (urlStatus && urlStatus !== prefs.status) {
      setPrefs((p) => ({ ...p, status: urlStatus }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("leads")
      .select("id, full_name, phone, email, status, source, utm_source, assigned_to, created_at, updated_at")
      .order(prefs.sortKey, { ascending: prefs.sortDir === "asc" })
      .limit(500);
    if (prefs.status !== "all") q = q.eq("status", prefs.status as LeadStatus);
    const { data, error } = await q;
    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  }, [prefs.sortKey, prefs.sortDir, prefs.status]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("leads-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const sources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      const s = l.utm_source || l.source;
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (prefs.source !== "all" && (l.utm_source || l.source) !== prefs.source) return false;
      if (!s) return true;
      return (
        l.full_name.toLowerCase().includes(s) ||
        l.phone.toLowerCase().includes(s) ||
        (l.email ?? "").toLowerCase().includes(s)
      );
    });
  }, [leads, search, prefs.source]);

  // hotkeys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (e.key === "/" && !inField) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (inField) return;
      if (e.key === "Escape") {
        setSelected(new Set());
        setCursor(-1);
        return;
      }
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(filtered.length - 1, c + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === "Enter" && cursor >= 0 && filtered[cursor]) {
        navigate(`/admin/leads/${filtered[cursor].id}`);
      } else if (e.key === "x" && cursor >= 0 && filtered[cursor]) {
        const id = filtered[cursor].id;
        setSelected((s) => {
          const n = new Set(s);
          n.has(id) ? n.delete(id) : n.add(id);
          return n;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, cursor, navigate]);

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(filtered.map((l) => l.id)));
    else setSelected(new Set());
  };

  const updateStatus = async (id: string, status: LeadStatus) => {
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) {
      setLeads(prev);
      toast.error("Не удалось изменить статус");
    } else {
      toast.success(`Статус: ${LEAD_STATUS_LABELS[status]}`);
    }
  };

  const bulkStatus = async (status: LeadStatus) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const { error } = await supabase.from("leads").update({ status }).in("id", ids);
    if (error) toast.error("Ошибка массового обновления");
    else {
      toast.success(`Обновлено: ${ids.length}`);
      setSelected(new Set());
      load();
    }
  };

  const bulkAssignMe = async () => {
    if (!me) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("leads").update({ assigned_to: me }).in("id", ids);
    if (error) toast.error("Ошибка назначения");
    else {
      toast.success(`Назначено: ${ids.length}`);
      setSelected(new Set());
      load();
    }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`Удалить ${ids.length} заявок?`)) return;
    const { error } = await supabase.from("leads").delete().in("id", ids);
    if (error) toast.error("Ошибка удаления");
    else {
      toast.success(`Удалено: ${ids.length}`);
      setSelected(new Set());
      load();
    }
  };

  const setSort = (key: SortKey) => {
    setPrefs((p) => ({
      ...p,
      sortKey: key,
      sortDir: p.sortKey === key ? (p.sortDir === "asc" ? "desc" : "asc") : "desc",
    }));
  };

  const setStatus = (v: string) => {
    setPrefs((p) => ({ ...p, status: v }));
    const next = new URLSearchParams(params);
    if (v === "all") next.delete("status");
    else next.set("status", v);
    setParams(next, { replace: true });
  };

  const showCol = (k: ColKey) => prefs.cols.includes(k);
  const colCount = prefs.cols.length + 1; // + checkbox col

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPrefs((p) => ({ ...p, source: "all" }));
  };

  const activeFilters =
    (prefs.status !== "all" ? 1 : 0) + (prefs.source !== "all" ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Заявки</h1>
          <p className="text-xs text-muted-foreground">
            {filtered.length} из {leads.length} · нажмите <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">/</kbd> для поиска
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={view} onValueChange={(v) => setView(v as "table" | "board")}>
            <TabsList>
              <TabsTrigger value="table" className="gap-1.5"><TableIcon className="h-3.5 w-3.5" /> Таблица</TabsTrigger>
              <TabsTrigger value="board" className="gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> Доска</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Имя, телефон, email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 pl-8"
            />
          </div>
          <Select value={prefs.status} onValueChange={setStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={prefs.source} onValueChange={(v) => setPrefs((p) => ({ ...p, source: v }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Источник" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все источники</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-3.5 w-3.5" /> Сбросить
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Columns3 className="h-4 w-4" /> Колонки
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Показать колонки</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLS.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={prefs.cols.includes(c.key)}
                  onCheckedChange={(v) =>
                    setPrefs((p) => ({
                      ...p,
                      cols: v ? [...p.cols, c.key] : p.cols.filter((k) => k !== c.key),
                    }))
                  }
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-primary/40 bg-primary/5 animate-in fade-in slide-in-from-top-1">
          <span className="text-sm font-medium">Выбрано: {selected.size}</span>
          <div className="h-4 w-px bg-border mx-1" />
          <Select onValueChange={(v) => bulkStatus(v as LeadStatus)}>
            <SelectTrigger className="h-8 w-44">
              <SelectValue placeholder="Изменить статус" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={bulkAssignMe} className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Назначить мне
          </Button>
          <Button variant="destructive" size="sm" onClick={bulkDelete}>
            Удалить
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onCheckedChange={(v) => toggleAll(!!v)}
                />
              </TableHead>
              {showCol("client") && (
                <TableHead>
                  <button onClick={() => setSort("full_name")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Клиент <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </button>
                </TableHead>
              )}
              {showCol("phone") && <TableHead>Телефон</TableHead>}
              {showCol("email") && <TableHead>Email</TableHead>}
              {showCol("status") && (
                <TableHead>
                  <button onClick={() => setSort("status")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Статус <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </button>
                </TableHead>
              )}
              {showCol("source") && <TableHead>Источник</TableHead>}
              {showCol("sla") && (
                <TableHead>
                  <button onClick={() => setSort("updated_at")} className="inline-flex items-center gap-1 hover:text-foreground">
                    SLA <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </button>
                </TableHead>
              )}
              {showCol("created") && (
                <TableHead>
                  <button onClick={() => setSort("created_at")} className="inline-flex items-center gap-1 hover:text-foreground">
                    Создана <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </button>
                </TableHead>
              )}
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colCount + 1} className="text-center text-muted-foreground py-8">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount + 1}>
                  <EmptyState
                    icon={activeFilters > 0 ? Filter : Inbox}
                    title={activeFilters > 0 ? "Ничего не найдено" : "Заявок пока нет"}
                    description={activeFilters > 0 ? "Попробуйте сбросить фильтры" : "Новые заявки появятся здесь автоматически"}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l, i) => {
                const sla = slaTone(l);
                const isSel = selected.has(l.id);
                const isCursor = cursor === i;
                return (
                  <TableRow
                    key={l.id}
                    data-state={isSel ? "selected" : undefined}
                    className={`group ${isCursor ? "bg-muted/40 ring-1 ring-inset ring-primary/30" : ""}`}
                    onClick={() => setCursor(i)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSel}
                        onCheckedChange={(v) => {
                          setSelected((s) => {
                            const n = new Set(s);
                            v ? n.add(l.id) : n.delete(l.id);
                            return n;
                          });
                        }}
                      />
                    </TableCell>
                    {showCol("client") && (
                      <TableCell>
                        <Link
                          to={`/admin/leads/${l.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {l.full_name}
                        </Link>
                      </TableCell>
                    )}
                    {showCol("phone") && (
                      <TableCell className="tabular-nums text-sm">{l.phone}</TableCell>
                    )}
                    {showCol("email") && (
                      <TableCell className="text-muted-foreground text-sm">{l.email ?? "—"}</TableCell>
                    )}
                    {showCol("status") && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v as LeadStatus)}>
                          <SelectTrigger className="h-7 w-auto min-w-[130px] border-0 bg-transparent px-2 hover:bg-muted [&>svg]:opacity-0 group-hover:[&>svg]:opacity-50">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[l.status]}`} />
                              <span className="text-xs">{LEAD_STATUS_LABELS[l.status]}</span>
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                <span className="inline-flex items-center gap-1.5">
                                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[s]}`} />
                                  {LEAD_STATUS_LABELS[s]}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    )}
                    {showCol("source") && (
                      <TableCell className="text-muted-foreground text-xs">
                        {l.utm_source ?? l.source ?? "—"}
                      </TableCell>
                    )}
                    {showCol("sla") && (
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={`h-1.5 w-1.5 rounded-full ${sla.color}`} />
                          <span className="text-muted-foreground">{sla.label}</span>
                        </span>
                      </TableCell>
                    )}
                    {showCol("created") && (
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(l.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                    )}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/leads/${l.id}`)}>Открыть</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(l.phone)}>Скопировать телефон</DropdownMenuItem>
                          {l.email && (
                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(l.email!)}>
                              Скопировать email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelected(new Set([l.id]));
                              bulkAssignMe();
                            }}
                          >
                            Назначить мне
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminLeads;