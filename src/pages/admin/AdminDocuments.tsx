import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Download, Plus, Trash2 } from "lucide-react";
import { DOCUMENT_KINDS, DOCUMENT_KIND_LABELS, DocumentKind, formatBytes } from "@/lib/documents";

type Doc = {
  id: string;
  kind: DocumentKind;
  title: string;
  storage_path: string;
  size_bytes: number | null;
  deal_id: string | null;
  client_id: string | null;
  created_at: string;
};

type Template = {
  id: string;
  name: string;
  kind: DocumentKind;
  body: string;
  updated_at: string;
};

const AdminDocuments = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tplOpen, setTplOpen] = useState(false);
  const [tplForm, setTplForm] = useState({ name: "", kind: "contract" as DocumentKind, body: "" });

  const load = async () => {
    const { data } = await supabase
      .from("documents")
      .select("id, kind, title, storage_path, size_bytes, deal_id, client_id, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setDocs((data ?? []) as Doc[]);
    const { data: tpls } = await supabase
      .from("document_templates")
      .select("id, name, kind, body, updated_at")
      .order("updated_at", { ascending: false });
    setTemplates((tpls ?? []) as Template[]);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = docs.filter((d) =>
    !search ? true : d.title.toLowerCase().includes(search.toLowerCase()),
  );

  const download = async (d: Doc) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(d.storage_path, 60);
    if (error || !data) return toast.error("Ошибка ссылки");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const remove = async (d: Doc) => {
    if (!confirm("Удалить документ?")) return;
    await supabase.storage.from("documents").remove([d.storage_path]);
    await supabase.from("documents").delete().eq("id", d.id);
    toast.success("Удалено");
    load();
  };

  const createTemplate = async () => {
    if (!tplForm.name.trim()) return toast.error("Введите название");
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase.from("document_templates").insert({
      ...tplForm,
      created_by: userRes.user?.id ?? null,
    });
    if (error) return toast.error("Не удалось создать (нужны права администратора)");
    toast.success("Шаблон создан");
    setTplOpen(false);
    setTplForm({ name: "", kind: "contract", body: "" });
    load();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Удалить шаблон?")) return;
    const { error } = await supabase.from("document_templates").delete().eq("id", id);
    if (error) return toast.error("Нет прав");
    toast.success("Удалено");
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Документы</h1>
      <Tabs defaultValue="files">
        <TabsList>
          <TabsTrigger value="files">Файлы</TabsTrigger>
          <TabsTrigger value="templates">Шаблоны</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-3">
          <Input
            placeholder="Поиск по названию"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80"
          />
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Размер</TableHead>
                  <TableHead>Привязка</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">Документов нет</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.title}</TableCell>
                      <TableCell>{DOCUMENT_KIND_LABELS[d.kind]}</TableCell>
                      <TableCell className="text-muted-foreground">{formatBytes(d.size_bytes)}</TableCell>
                      <TableCell className="text-sm">
                        {d.deal_id ? (
                          <Link to={`/admin/deals/${d.deal_id}`} className="text-primary hover:underline">Сделка</Link>
                        ) : d.client_id ? (
                          <Link to={`/admin/clients/${d.client_id}`} className="text-primary hover:underline">Клиент</Link>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(d.created_at).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => download(d)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(d)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-3">
          <Dialog open={tplOpen} onOpenChange={setTplOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Новый шаблон</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Шаблон документа</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Название</Label>
                  <Input value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} />
                </div>
                <div>
                  <Label>Тип</Label>
                  <Select value={tplForm.kind} onValueChange={(v) => setTplForm({ ...tplForm, kind: v as DocumentKind })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_KINDS.map((k) => (
                        <SelectItem key={k} value={k}>{DOCUMENT_KIND_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Текст шаблона</Label>
                  <Textarea
                    rows={10}
                    value={tplForm.body}
                    onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })}
                    placeholder={"Можно использовать {{client_name}}, {{deal_title}}, {{budget}} и т.п."}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTplOpen(false)}>Отмена</Button>
                <Button onClick={createTemplate}>Сохранить</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Обновлён</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Шаблонов нет</TableCell>
                  </TableRow>
                ) : (
                  templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{DOCUMENT_KIND_LABELS[t.kind]}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(t.updated_at).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => deleteTemplate(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDocuments;