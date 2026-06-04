import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Download, Trash2, Upload, FileText } from "lucide-react";
import {
  DOCUMENT_KINDS,
  DOCUMENT_KIND_LABELS,
  DocumentKind,
  formatBytes,
} from "@/lib/documents";

type Doc = {
  id: string;
  kind: DocumentKind;
  title: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

type Props = {
  dealId?: string;
  clientId?: string;
};

const DocumentsList = ({ dealId, clientId }: Props) => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<DocumentKind>("other");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!dealId && !clientId) return;
    setLoading(true);
    let q = supabase
      .from("documents")
      .select("id, kind, title, storage_path, mime_type, size_bytes, created_at")
      .order("created_at", { ascending: false });
    if (dealId) q = q.eq("deal_id", dealId);
    if (clientId && !dealId) q = q.eq("client_id", clientId);
    const { data } = await q;
    setDocs((data ?? []) as Doc[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, clientId]);

  const onPick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? "anon";
      const folder = dealId ? `deals/${dealId}` : clientId ? `clients/${clientId}` : `misc/${uid}`;
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${folder}/${Date.now()}_${safe}`;

      const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("documents").insert({
        kind,
        title: file.name,
        storage_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
        deal_id: dealId ?? null,
        client_id: clientId ?? null,
        uploaded_by: userRes.user?.id ?? null,
      });
      if (insErr) throw insErr;

      toast.success("Документ загружен");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Не удалось загрузить");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const download = async (doc: Doc) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.storage_path, 60);
    if (error || !data) {
      toast.error("Не удалось получить ссылку");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const remove = async (doc: Doc) => {
    if (!confirm("Удалить документ?")) return;
    const { error: sErr } = await supabase.storage.from("documents").remove([doc.storage_path]);
    if (sErr) {
      toast.error("Ошибка удаления файла");
      return;
    }
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) toast.error("Ошибка удаления записи");
    else {
      toast.success("Удалено");
      load();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={kind} onValueChange={(v) => setKind(v as DocumentKind)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DOCUMENT_KINDS.map((k) => (
              <SelectItem key={k} value={k}>{DOCUMENT_KIND_LABELS[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input ref={inputRef} type="file" hidden onChange={onFile} />
        <Button size="sm" onClick={onPick} disabled={uploading}>
          <Upload className="h-4 w-4 mr-1" /> {uploading ? "Загрузка..." : "Загрузить"}
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Загрузка...</div>
      ) : docs.length === 0 ? (
        <div className="text-sm text-muted-foreground">Документов нет</div>
      ) : (
        <ul className="divide-y divide-border/40 rounded-md border border-border/40">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between p-3 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {DOCUMENT_KIND_LABELS[d.kind]} · {formatBytes(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => download(d)} title="Скачать">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(d)} title="Удалить">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentsList;