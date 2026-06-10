import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/proxy-client";
import OnboardingGuide from "@/components/admin/OnboardingGuide";
import HotkeysSheet from "@/components/admin/HotkeysSheet";
import CRMFaq from "@/components/admin/CRMFaq";
import TemplatesManager from "@/components/admin/TemplatesManager";
import EmailSettings from "@/components/admin/EmailSettings";
import AlistaContractSample from "@/components/admin/AlistaContractSample";
import HintCard from "@/components/admin/HintCard";

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "profile";

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
    <div className="space-y-4 max-w-6xl">
      <h1 className="text-2xl font-semibold">Настройки</h1>
      <HintCard storageKey="settings" title="Настройки рабочего пространства">
        Здесь настраиваются: профиль и пароль, корпоративная почта, шаблоны документов и готовых ответов,
        пошаговое обучение, горячие клавиши и справка. Если скрыли подсказки в других разделах — верните их
        кнопкой ниже.
        <button
          type="button"
          onClick={() => {
            try {
              Object.keys(localStorage)
                .filter((k) => k.startsWith("hint_dismissed_") || k.startsWith("hint_open_"))
                .forEach((k) => localStorage.removeItem(k));
              location.reload();
            } catch {
              /* ignore */
            }
          }}
          className="ml-2 underline text-primary hover:text-primary/80"
        >
          Показать все подсказки заново
        </button>
      </HintCard>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = new URLSearchParams(searchParams);
          if (v === "profile") next.delete("tab");
          else next.set("tab", v);
          setSearchParams(next, { replace: true });
        }}
      >
        <TabsList>
          <TabsTrigger value="profile">Профиль</TabsTrigger>
          <TabsTrigger value="email">Почта</TabsTrigger>
          <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          <TabsTrigger value="onboarding">Обучение</TabsTrigger>
          <TabsTrigger value="hotkeys">Горячие клавиши</TabsTrigger>
          <TabsTrigger value="faq">Справка / FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 max-w-2xl">
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
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingGuide />
        </TabsContent>
        <TabsContent value="templates">
          <div className="space-y-4">
            <AlistaContractSample />
            <TemplatesManager />
          </div>
        </TabsContent>
        <TabsContent value="email">
          <EmailSettings />
        </TabsContent>
        <TabsContent value="hotkeys">
          <HotkeysSheet />
        </TabsContent>
        <TabsContent value="faq">
          <CRMFaq />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;