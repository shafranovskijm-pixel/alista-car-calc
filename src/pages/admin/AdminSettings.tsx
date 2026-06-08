import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Сохранено" });
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">Настройки</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Профиль</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="mb-2 block">Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div>
            <Label className="mb-2 block">Имя</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              placeholder="Иван Иванов"
            />
          </div>
          <Button onClick={save} disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Интеграции</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>В следующих спринтах здесь появится:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Telegram-уведомления о новых заявках (бот и chat_id)</li>
            <li>E-mail рассылка через SMTP/Resend</li>
            <li>Счётчик Яндекс.Метрики и настройка целей</li>
            <li>Поп-ап «Спецпредложение» и его управление</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;