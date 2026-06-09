import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: () => void;
};

type Row = { full_name: string; phone: string; email?: string; source?: string; message?: string };

const splitCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === "," || ch === ";" || ch === "\t") {
        cur.push(cell);
        cell = "";
      } else if (ch === "\n") {
        cur.push(cell);
        rows.push(cur);
        cur = [];
        cell = "";
      } else if (ch === "\r") {
        /* skip */
      } else cell += ch;
    }
  }
  if (cell.length || cur.length) {
    cur.push(cell);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
};

const matchHeader = (h: string): keyof Row | null => {
  const x = h.trim().toLowerCase();
  if (/имя|фио|name|client|клиент/.test(x)) return "full_name";
  if (/тел|phone|номер/.test(x)) return "phone";
  if (/mail|почта/.test(x)) return "email";
  if (/источник|source|utm/.test(x)) return "source";
  if (/сообщ|comment|message|примеч/.test(x)) return "message";
  return null;
};

const ImportLeadsDialog = ({ open, onOpenChange, onImported }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setRows([]);
    setError(null);
  };

  const valid = useMemo(
    () => rows.filter((r) => r.full_name?.trim() && r.phone?.trim()),
    [rows],
  );

  const onFile = async (file: File) => {
    reset();
    if (file.size > 2 * 1024 * 1024) {
      setError("Файл больше 2 МБ — слишком большой");
      return;
    }
    const text = await file.text();
    const matrix = splitCsv(text.replace(/^\ufeff/, ""));
    if (matrix.length < 2) {
      setError("Не нашёл строк. Нужен заголовок + хотя бы одна строка.");
      return;
    }
    const headers = matrix[0].map(matchHeader);
    const phoneIdx = headers.indexOf("phone");
    const nameIdx = headers.indexOf("full_name");
    if (phoneIdx < 0 || nameIdx < 0) {
      setError("Не нашёл колонки «Имя» и «Телефон». Переименуйте заголовки.");
      return;
    }
    const parsed: Row[] = matrix.slice(1).map((r) => {
      const row: Row = { full_name: "", phone: "" };
      headers.forEach((h, i) => {
        if (!h) return;
        const v = (r[i] ?? "").trim();
        if (v) (row as Record<string, string>)[h] = v;
      });
      row.full_name = row.full_name.slice(0, 150);
      row.phone = row.phone.slice(0, 50);
      return row;
    });
    setRows(parsed);
  };

  const importNow = async () => {
    if (!valid.length) return;
    setSaving(true);
    const payload = valid.map((r) => ({
      full_name: r.full_name.trim(),
      phone: r.phone.trim(),
      email: r.email?.trim() || null,
      source: r.source?.trim() || "import",
      message: r.message?.trim() || null,
      status: "new" as const,
    }));
    const { error: err, count } = await supabase
      .from("leads")
      .insert(payload, { count: "exact" });
    setSaving(false);
    if (err) {
      toast.error("Ошибка импорта: " + err.message);
      return;
    }
    toast.success(`Импортировано: ${count ?? payload.length}`);
    onOpenChange(false);
    reset();
    onImported?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Импорт заявок из CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground text-xs">
            CSV с разделителем «,» или «;». Обязательные колонки — <b>Имя</b> и <b>Телефон</b>. Опционально:
            Email, Источник, Сообщение.
          </p>
          <div>
            <Label className="mb-1.5 block">Файл CSV</Label>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/5 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {rows.length > 0 && (
            <div className="rounded-md border border-border/60 p-2.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Найдено строк: <b>{rows.length}</b> · валидных: <b className="text-emerald-400">{valid.length}</b>
                {rows.length > valid.length && (
                  <span className="text-amber-400">
                    · пропущено {rows.length - valid.length} (нет имени/телефона)
                  </span>
                )}
              </div>
              <div className="max-h-40 overflow-auto rounded border border-border/40 text-[11px]">
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-2 py-1 text-left">Имя</th>
                      <th className="px-2 py-1 text-left">Телефон</th>
                      <th className="px-2 py-1 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valid.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-t border-border/30">
                        <td className="px-2 py-1">{r.full_name}</td>
                        <td className="px-2 py-1 tabular-nums">{r.phone}</td>
                        <td className="px-2 py-1 text-muted-foreground">{r.email ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {valid.length > 20 && (
                <div className="text-[11px] text-muted-foreground">…и ещё {valid.length - 20}</div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={importNow} disabled={!valid.length || saving} className="gap-1.5">
            <Upload className="h-4 w-4" />
            {saving ? "Импорт..." : `Импортировать (${valid.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportLeadsDialog;