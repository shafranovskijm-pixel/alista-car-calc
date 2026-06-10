import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/proxy-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { Download, Eye, FileText, Loader2, Sparkles, Trash2 } from "lucide-react";
import { renderAsync } from "docx-preview";
import { formatBytes } from "@/lib/documents";
import GenerateDocumentDialog from "@/components/admin/GenerateDocumentDialog";

type Row = {
  id: string;
  title: string;
  storage_path: string;
  size_bytes: number | null;
  created_at: string;
};

type Props = { dealId: string };

const AlistaContractsList = ({ dealId }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [genOpen, setGenOpen] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("id, title, storage_path, size_bytes, created_at")
      .eq("deal_id", dealId)
      .eq("kind", "contract")
      .like("storage_path", `deals/${dealId}/contracts/%`)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    load();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ dealId: string }>).detail;
      if (!detail || detail.dealId === dealId) load();
    };
    window.addEventListener("alista-contracts-updated", handler);
    return () => window.removeEventListener("alista-contracts-updated", handler);
  }, [dealId, load]);

  const fetchBlob = async (path: string): Promise<Blob | null> => {
    const { data, error } = await supabase.storage.from("documents").download(path);
    if (error || !data) {
      toast.error("Не удалось загрузить файл");
      return null;
    }
    return data;
  };

  const onPreview = async (r: Row) => {
    setPreviewing(r.id);
    try {
      const blob = await fetchBlob(r.storage_path);
      if (!blob) return;
      setPreviewTitle(r.title);
      setPreviewOpen(true);
      requestAnimationFrame(async () => {
        if (!previewRef.current) return;
        previewRef.current.innerHTML = "";
        await renderAsync(blob, previewRef.current, undefined, {
          className: "alista-docx",
          inWrapper: true,
          experimental: true,
          useBase64URL: true,
        });
      });
    } finally {
      setPreviewing(null);
    }
  };

  const onDownload = async (r: Row) => {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(r.storage_path, 60);
    if (error || !data) {
      toast.error("Не удалось получить ссылку");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const onDelete = async (r: Row) => {
    if (!confirm(`Удалить «${r.title}»?`)) return;
    await supabase.storage.from("documents").remove([r.storage_path]);
    const { error } = await supabase.from("documents").delete().eq("id", r.id);
    if (error) toast.error("Не удалось удалить");
    else {
      toast.success("Удалено");
      load();
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Договоры Алиста
            <span className="text-xs text-muted-foreground font-normal">({rows.length})</span>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setGenOpen(true)} className="gap-1.5">
            <FileText className="h-4 w-4" /> Сгенерировать
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Загрузка…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">
              Пока ни одного договора. Нажмите «Сгенерировать» — файл сохранится здесь автоматически.
            </div>
          ) : (
            <ul className="divide-y divide-border/40 rounded-md border border-border/40">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {formatBytes(r.size_bytes)} · шаблон «Алиста (.docx)»
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Предпросмотр"
                      disabled={previewing === r.id}
                      onClick={() => onPreview(r)}
                    >
                      {previewing === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="icon" variant="ghost" title="Скачать" onClick={() => onDownload(r)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Удалить" onClick={() => onDelete(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <GenerateDocumentDialog
        open={genOpen}
        onOpenChange={setGenOpen}
        templates={[]}
        defaultPreset="alista"
        defaultDealId={dealId}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-primary" /> {previewTitle}
            </DialogTitle>
          </DialogHeader>
          <div
            ref={previewRef}
            className="alista-docx-preview flex-1 overflow-y-auto rounded-md border border-border/60 bg-white"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AlistaContractsList;