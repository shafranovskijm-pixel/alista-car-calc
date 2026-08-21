import { useId, useState } from "react";
import { z } from "zod";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/proxy-client";
import type { Json } from "@/integrations/supabase/types";
import { captureUtm } from "@/lib/utm";

const schema = z.object({
  full_name: z.string().trim().min(2, "Минимум 2 символа").max(100),
  phone: z
    .string()
    .trim()
    .min(5, "Введите телефон")
    .max(30)
    .regex(/^[+0-9\s()-]+$/, "Только цифры и + - ( )"),
  email: z.string().trim().email("Некорректный email").max(255).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional(),
});

export type LeadFormProps = {
  source: string;
  defaultMessage?: string;
  buttonLabel?: string;
  compact?: boolean;
  showEmail?: boolean;
  onSubmitted?: () => void;
  objectInterest?: string;
  calcSnapshot?: Json | null;
};

const LeadForm = ({
  source,
  defaultMessage = "",
  buttonLabel = "Отправить заявку",
  compact = false,
  showEmail = false,
  onSubmitted,
  objectInterest,
  calcSnapshot,
}: LeadFormProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    message: defaultMessage,
  });
  const [loading, setLoading] = useState(false);
  const idPrefix = useId();
  const nameId = `${idPrefix}-full-name`;
  const phoneId = `${idPrefix}-phone`;
  const emailId = `${idPrefix}-email`;
  const messageId = `${idPrefix}-message`;

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Проверьте поля",
        description: parsed.error.issues[0]?.message ?? "Ошибка валидации",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const utm = captureUtm();
      const leadId = crypto.randomUUID();
      const { error } = await supabase.from("leads").insert({
        id: leadId,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        message: parsed.data.message || null,
        source,
        page_url: typeof window !== "undefined" ? window.location.href.slice(0, 500) : null,
        status: "new",
        object_interest: objectInterest ?? null,
        calc_snapshot: calcSnapshot ?? null,
        ...utm,
      });
      if (error) throw error;
      // Уведомление по email — не блокируем UX при ошибке.
      supabase.functions
        .invoke("notify-new-lead", { body: { leadId } })
        .catch(() => {});
      toast({
        title: "Заявка зарегистрирована",
        description: "Свяжемся по указанным контактам",
      });
      setForm({ full_name: "", phone: "", email: "", message: defaultMessage });
      onSubmitted?.();
    } catch (err: unknown) {
      toast({
        title: "Не удалось отправить",
        description: err instanceof Error ? err.message : "Попробуйте позже или напишите в WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        <Label htmlFor={nameId} className="text-foreground font-medium mb-2 block">Ваше имя *</Label>
        <Input
          id={nameId}
          name="full_name"
          autoComplete="name"
          required
          maxLength={100}
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          placeholder="Иван Иванов"
          className="bg-secondary border-border"
        />
      </div>
      <div>
        <Label htmlFor={phoneId} className="text-foreground font-medium mb-2 block">Телефон *</Label>
        <Input
          id={phoneId}
          name="phone"
          autoComplete="tel"
          required
          maxLength={30}
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+7 XXX XXX-XX-XX"
          className="bg-secondary border-border"
        />
      </div>
      {showEmail && (
        <div>
          <Label htmlFor={emailId} className="text-foreground font-medium mb-2 block">Email</Label>
          <Input
            id={emailId}
            name="email"
            autoComplete="email"
            maxLength={255}
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
            className="bg-secondary border-border"
          />
        </div>
      )}
      {!compact && (
        <div>
          <Label htmlFor={messageId} className="text-foreground font-medium mb-2 block">Сообщение</Label>
          <Textarea
            id={messageId}
            name="message"
            autoComplete="off"
            maxLength={1000}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Опишите ваш запрос..."
            className="bg-secondary border-border min-h-[100px]"
          />
        </div>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="w-full gradient-accent font-semibold text-primary-foreground hover:opacity-90"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        {buttonLabel}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
      </p>
    </form>
  );
};

export default LeadForm;
