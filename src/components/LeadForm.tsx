import { useState } from "react";
import { z } from "zod";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { captureUtm } from "@/lib/utm";

const schema = z.object({
  full_name: z.string().trim().min(2, "Минимум 2 символа").max(100),
  phone: z
    .string()
    .trim()
    .min(5, "Введите телефон")
    .max(30)
    .regex(/^[+0-9\s()\-]+$/, "Только цифры и + - ( )"),
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
  calcSnapshot?: Record<string, unknown> | null;
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
      const { error } = await supabase.from("leads").insert({
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
      toast({
        title: "Заявка отправлена",
        description: "Менеджер свяжется с вами в ближайшее время",
      });
      setForm({ full_name: "", phone: "", email: "", message: defaultMessage });
      onSubmitted?.();
    } catch (err: any) {
      toast({
        title: "Не удалось отправить",
        description: err?.message ?? "Попробуйте позже или напишите в WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div>
        <Label className="text-foreground font-medium mb-2 block">Ваше имя *</Label>
        <Input
          required
          maxLength={100}
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          placeholder="Иван Иванов"
          className="bg-secondary border-border"
        />
      </div>
      <div>
        <Label className="text-foreground font-medium mb-2 block">Телефон *</Label>
        <Input
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
          <Label className="text-foreground font-medium mb-2 block">Email</Label>
          <Input
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
          <Label className="text-foreground font-medium mb-2 block">Сообщение</Label>
          <Textarea
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