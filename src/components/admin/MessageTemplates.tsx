import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquareQuote, Copy } from "lucide-react";
import { EmptyState } from "./EmptyState";

type Template = {
  id: string;
  title: string;
  channel: string;
  body: string;
  category: string | null;
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  sms: "SMS",
  other: "Прочее",
};

export const renderTemplate = (body: string, vars: Record<string, string | number | null | undefined>) =>
  body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null || v === "" ? `{{${key}}}` : String(v);
  });

interface Props {
  vars?: Record<string, string | number | null | undefined>;
  onInsert?: (text: string) => void;
  buttonLabel?: string;
  size?: "sm" | "default";
}

const MessageTemplates = ({ vars = {}, onInsert, buttonLabel = "Шаблоны", size = "sm" }: Props) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("message_templates")
      .select("id,title,channel,body,category")
      .order("title")
      .then(({ data }) => {
        setItems((data ?? []) as Template[]);
        setLoading(false);
      });
  }, [open]);

  const useTpl = async (tpl: Template) => {
    const rendered = renderTemplate(tpl.body, vars);
    if (onInsert) {
      onInsert(rendered);
      toast.success("Вставлено");
    } else {
      try {
        await navigator.clipboard.writeText(rendered);
        toast.success("Скопировано в буфер");
      } catch {
        toast.error("Не удалось скопировать");
      }
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size={size} type="button">
          <MessageSquareQuote className="h-4 w-4 mr-1" /> {buttonLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-3 border-b text-sm font-medium">Шаблоны сообщений</div>
        <div className="max-h-80 overflow-auto">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Загрузка...</div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={MessageSquareQuote}
              title="Шаблонов нет"
              description="Добавьте их в Настройки → Шаблоны"
            />
          ) : (
            <ul className="divide-y">
              {items.map((t) => (
                <li key={t.id} className="p-3 hover:bg-muted/40 cursor-pointer" onClick={() => useTpl(t)}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{t.title}</span>
                    <Badge variant="outline" className="text-[10px]">{CHANNEL_LABELS[t.channel] ?? t.channel}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                    {renderTemplate(t.body, vars)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Copy className="h-3 w-3" /> {onInsert ? "Клик — вставить" : "Клик — скопировать"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MessageTemplates;