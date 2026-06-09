import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Briefcase,
  FileText,
  Car,
  Settings,
  LogOut,
  BarChart3,
  Images,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import GlobalSearch from "./GlobalSearch";
import NotificationsBell from "./NotificationsBell";
import CurrencyTicker from "./CurrencyTicker";

type Item = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badgeKey?: "leads_new" | "deals_active";
};

const groups: { label: string; items: Item[] }[] = [
  {
    label: "Продажи",
    items: [
      { title: "Дашборд", url: "/admin", icon: LayoutDashboard, end: true },
      { title: "Заявки", url: "/admin/leads", icon: Inbox, badgeKey: "leads_new" },
      { title: "Клиенты", url: "/admin/clients", icon: Users },
      { title: "Сделки", url: "/admin/deals", icon: Briefcase, badgeKey: "deals_active" },
    ],
  },
  {
    label: "Каталог",
    items: [
      { title: "Наши работы", url: "/admin/works", icon: Images },
      { title: "Каталог авто", url: "/admin/cars", icon: Car },
    ],
  },
  {
    label: "Аналитика",
    items: [
      { title: "Документы", url: "/admin/documents", icon: FileText },
      { title: "Отчёты", url: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Система",
    items: [
      { title: "Обучение", url: "/admin/settings?tab=onboarding", icon: GraduationCap },
      { title: "Настройки", url: "/admin/settings", icon: Settings, end: true },
    ],
  },
];

const AdminLayout = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [leadsNew, dealsActive] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true })
          .not("stage", "in", "(completed,cancelled)"),
      ]);
      setBadges({
        leads_new: leadsNew.count ?? 0,
        deals_active: dealsActive.count ?? 0,
      });
    };
    load();
    const ch = supabase
      .channel("sidebar-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md gradient-accent flex items-center justify-center text-xs font-bold text-primary-foreground">A</div>
                <span className="font-heading text-sm font-semibold tracking-wider">CRM ALISTA</span>
              </div>
            </div>
            {groups.map((g) => (
              <SidebarGroup key={g.label}>
                <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {g.items.map((item) => {
                      const [itemPath, itemQuery] = item.url.split("?");
                      const pathMatch = item.end
                        ? location.pathname === itemPath
                        : location.pathname === itemPath || location.pathname.startsWith(itemPath + "/");
                      let active = pathMatch;
                      if (itemQuery) {
                        const want = new URLSearchParams(itemQuery);
                        const have = new URLSearchParams(location.search);
                        active = pathMatch && Array.from(want.entries()).every(([k, v]) => have.get(k) === v);
                      } else if (pathMatch && location.search) {
                        // plain settings item should not light up when ?tab=... is present
                        const tab = new URLSearchParams(location.search).get("tab");
                        if (item.url === "/admin/settings" && tab && tab !== "profile") active = false;
                      }
                      const badge = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0;
                      return (
                        <SidebarMenuItem key={item.url}>
                          <SidebarMenuButton asChild isActive={active}>
                            <NavLink to={item.url} end={item.end}>
                              <item.icon />
                              <span className="flex-1">{item.title}</span>
                              {badge > 0 && (
                                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
                                  {badge}
                                </span>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <Button variant="ghost" size="sm" onClick={signOut} className="justify-start">
              <LogOut className="h-4 w-4 mr-2" /> Выйти
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex-1 flex items-center gap-3">
              <GlobalSearch />
            </div>
            <CurrencyTicker />
            <NotificationsBell />
            <div className="hidden md:block text-xs text-muted-foreground max-w-[180px] truncate">{user.email}</div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;