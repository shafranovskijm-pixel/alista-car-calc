import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { LEAD_STATUS_LABELS, LeadStatus } from "@/lib/leads";
import EmptyState from "./EmptyState";

type Notice = {
  id: string;
  full_name: string;
  status: LeadStatus;
  created_at: string;
};

export const NotificationsBell = () => {
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, full_name, status, created_at")
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(8);
      setItems((data ?? []) as Notice[]);
      setUnread(data?.length ?? 0);
    };
    load();
    const ch = supabase
      .channel("notifications-new-leads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary/60 transition-colors">
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-3 py-2 border-b border-border text-sm font-medium">Новые заявки</div>
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="Уведомлений нет" description="Новые заявки появятся здесь" />
        ) : (
          <ul className="max-h-80 overflow-auto divide-y divide-border">
            {items.map((it) => (
              <li key={it.id}>
                <Link to={`/admin/leads/${it.id}`} className="flex items-start gap-2 px-3 py-2 hover:bg-secondary/60">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{it.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {LEAD_STATUS_LABELS[it.status]} · {new Date(it.created_at).toLocaleString("ru-RU")}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;