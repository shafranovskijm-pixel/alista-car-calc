import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Loader2, UserPlus, Trash2, ShieldCheck } from "lucide-react";
import HintCard from "@/components/admin/HintCard";

type Role = "admin" | "manager";
type Member = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  roles: Role[];
};

const roleLabel = (r: Role) => (r === "admin" ? "Администратор" : "Менеджер");

const TeamManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("manager");
  const [inviting, setInviting] = useState(false);

  const call = useCallback(
    async (action: string, method: "GET" | "POST", body?: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke(
        `team?action=${action}`,
        method === "GET" ? { method: "GET" } : { method: "POST", body },
      );
      if (error) {
        let msg = error.message;
        try {
          const ctx = (error as unknown as { context?: Response }).context;
          if (ctx) msg = await ctx.text();
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      return data as { members?: Member[]; ok?: boolean; error?: string };
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await call("list", "GET");
      setMembers(res.members ?? []);
    } catch (e) {
      toast({
        title: "Не удалось загрузить команду",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [call, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      toast({ title: "Введите корректный email", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      await call("invite", "POST", { email: clean, role, full_name: fullName.trim() });
      toast({
        title: "Приглашение отправлено",
        description: `${clean} получит письмо со ссылкой для входа.`,
      });
      setEmail("");
      setFullName("");
      await load();
    } catch (e) {
      toast({
        title: "Не удалось пригласить",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (m: Member, newRole: Role) => {
    if (m.roles.includes(newRole) && m.roles.length === 1) return;
    setBusy(m.id);
    try {
      await call("set_role", "POST", { user_id: m.id, role: newRole });
      toast({ title: "Роль обновлена" });
      await load();
    } catch (e) {
      toast({
        title: "Не удалось изменить роль",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (m: Member) => {
    if (!confirm(`Удалить сотрудника ${m.email ?? m.id}? Это действие необратимо.`)) return;
    setBusy(m.id);
    try {
      await call("remove", "POST", { user_id: m.id });
      toast({ title: "Сотрудник удалён" });
      await load();
    } catch (e) {
      toast({
        title: "Не удалось удалить",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <HintCard storageKey="team" title="Команда">
        Приглашайте сотрудников по email — на почту придёт письмо с ссылкой для входа и создания
        пароля. <b>Администратор</b> имеет полный доступ ко всем разделам и настройкам.
        <b> Менеджер</b> работает с заявками, сделками, клиентами и документами, но не видит настройки
        команды. Роль можно изменить или удалить сотрудника в любой момент.
      </HintCard>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Пригласить сотрудника
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr,1fr,200px,auto]">
            <div>
              <Label className="mb-2 block">Email</Label>
              <Input
                type="email"
                placeholder="ivan@alistaru.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
              />
            </div>
            <div>
              <Label className="mb-2 block">Имя (необязательно)</Label>
              <Input
                placeholder="Иван Иванов"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
              />
            </div>
            <div>
              <Label className="mb-2 block">Роль</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={invite} disabled={inviting} className="w-full md:w-auto">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Пригласить"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Сотрудники ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Загрузка…
            </div>
          ) : members.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Пока никого нет</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const isMe = m.id === user?.id;
                    const currentRole: Role = m.roles.includes("admin") ? "admin" : "manager";
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">
                          {m.email ?? "—"}{" "}
                          {isMe && (
                            <Badge variant="secondary" className="ml-1">
                              вы
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{m.full_name ?? "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={currentRole}
                            disabled={busy === m.id || (isMe && currentRole === "admin")}
                            onValueChange={(v) => changeRole(m, v as Role)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manager">{roleLabel("manager")}</SelectItem>
                              <SelectItem value="admin">{roleLabel("admin")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={busy === m.id || isMe}
                            onClick={() => remove(m)}
                            title={isMe ? "Нельзя удалить себя" : "Удалить"}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamManager;