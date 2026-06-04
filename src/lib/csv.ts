export const toCSV = (rows: Record<string, unknown>[], headers?: string[]) => {
  if (rows.length === 0 && !headers) return "";
  const keys = headers ?? Object.keys(rows[0] ?? {});
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = keys.join(";");
  const body = rows.map((r) => keys.map((k) => esc(r[k])).join(";")).join("\n");
  return head + "\n" + body;
};

export const downloadCSV = (filename: string, csv: string) => {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};