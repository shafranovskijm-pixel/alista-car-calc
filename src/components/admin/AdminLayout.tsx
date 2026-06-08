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
import { LayoutDashboard, Inbox, Users, Briefcase, FileText, Car, Settings, LogOut, BarChart3, Images } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const items = [
  { title: "Дашборд", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Заявки", url: "/admin/leads", icon: Inbox },
  { title: "Клиенты", url: "/admin/clients", icon: Users },
  { title: "Сделки", url: "/admin/deals", icon: Briefcase },
  { title: "Документы", url: "/admin/documents", icon: FileText },
  { title: "Отчёты", url: "/admin/reports", icon: BarChart3 },
  { title: "Наши работы", url: "/admin/works", icon: Images },
  { title: "Каталог авто", url: "/admin/cars", icon: Car },
  { title: "Настройки", url: "/admin/settings", icon: Settings },
];

const AdminLayout = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

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
            <SidebarGroup>
              <SidebarGroupLabel>CRM ALISTA</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          item.end
                            ? location.pathname === item.url
                            : location.pathname === item.url || location.pathname.startsWith(item.url + "/")
                        }
                      >
                        <NavLink to={item.url} end={item.end}>
                          <item.icon />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <Button variant="ghost" size="sm" onClick={signOut} className="justify-start">
              <LogOut className="h-4 w-4 mr-2" /> Выйти
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 gap-3">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
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