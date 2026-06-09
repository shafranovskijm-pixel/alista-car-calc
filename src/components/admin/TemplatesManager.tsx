import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { MessageSquareQuote } from "lucide-react";

type Template = {
  id: string;
  title: string;
  channel: string;
  body: string;
  category: string | null;
};

const CHANNELS = [
  { value: "email", label: "Email" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "other", label: "Прочее" },
];

const empty = { title: "", channel: "email", body: "", category: "" };

const TemplatesManager = () => {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("message_templates")
      .select("id,title,channel,body,category")
      .order("title");
    setItems((data ?? []) as Template[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const startCreate = () => {
    setEditId(null);
    setForm(empty);
    setOpen(true);
  };
  const startEdit = (t: Template) => {
    setEditId(t.id);
    setForm({ title: t.title, channel: t.channel, body: t.body, category: t.category ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Заполните название и текст");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      channel: form.channel,
      body: form.body,
      category: form.category.trim() || null,
    };
    const { error } = editId
      ? await supabase.from("message_templates").update(payload).eq("id", editId)
      : await supabase.from("message_templates").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Не удалось сохранить");
      return;
    }
    toast.success("Сохранено");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить шаблон?")) return;
    const { error } = await supabase.from("message_templates").delete().eq("id", id);
    if (error) {
      toast.error("Не удалось удалить");
      return;
    }
    toast.success("Удалено");
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Шаблоны быстрых ответов</CardTitle>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4 mr-1" /> Новый
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Используйте переменные:{" "}
          <code className="text-foreground">{"{{client.name}}"}</code>,{" "}
          <code className="text-foreground">{"{{client.phone}}"}</code>,{" "}
          <code className="text-foreground">{"{{deal.title}}"}</code>,{" "}
          <code className="text-foreground">{"{{deal.budget}}"}</code>,{" "}
          <code className="text-foreground">{"{{lead.name}}"}</code>,{" "}
          <code className="text-foreground">{"{{manager.name}}"}</code>
        </p>

        {loading ? (
          <div className="text-sm text-muted-foreground">Загрузка...</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="Шаблонов пока нет"
            description="Создайте первый шаблон, чтобы быстро отвечать клиентам в один клик."
            action={<Button size="sm" onClick={startCreate}><Plus className="h-4 w-4 mr-1" /> Создать</Button>}
          />
        ) : (
          <ul className="divide-y border rounded-md">
            {items.map((t) => (
              <li key={t.id} className="p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{t.title}</span>
                    <Badge variant="outline" className="text-[10px]">{t.channel}</Badge>
                    {t.category && <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">{t.body}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Изменить шаблон" : "Новый шаблон"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Название</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Канал</Label>
                  <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Категория</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Приветствие, КП..." />
                </div>
              </div>
              <div>
                <Label>Текст</Label>
                <Textarea
                  rows={8}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Здравствуйте, {{client.name}}! По вашей заявке на {{deal.title}}..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
              <Button onClick={save} disabled={saving}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TemplatesManager;