import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4_RATIO = 297 / 210;

const bgOf = (el: HTMLElement): string => {
  let cur: HTMLElement | null = el;
  while (cur) {
    const bg = getComputedStyle(cur).backgroundColor;
    if (bg && bg !== "transparent" && !bg.startsWith("rgba(0, 0, 0, 0)")) return bg;
    cur = cur.parentElement;
  }
  return "#ffffff";
};

/** Clone the node off-screen at full size so nothing is clipped by the preview scale/scroll. */
const snapshot = async (el: HTMLElement) => {
  const bg = bgOf(el);
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: bg,
    useCORS: true,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
    scrollX: 0,
    scrollY: 0,
  });
  return { canvas, bg };
};

/** Y offsets (in canvas px) where a page break is safe — top edge of each atomic block. */
const breakPoints = (el: HTMLElement, canvas: HTMLCanvasElement): number[] => {
  const ratio = canvas.height / el.offsetHeight;
  const base = el.getBoundingClientRect().top;
  const scale = el.getBoundingClientRect().height / el.offsetHeight || 1;
  const blocks = Array.from(el.querySelectorAll<HTMLElement>("[data-pdf-block]"));
  const set = new Set<number>([0]);
  blocks.forEach((b) => {
    const top = (b.getBoundingClientRect().top - base) / scale;
    set.add(Math.max(0, Math.round(top * ratio)));
  });
  return Array.from(set).sort((a, b) => a - b);
};

const addSlices = (
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  bg: string,
  points: number[],
  firstPage: boolean,
) => {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const pagePx = Math.floor(canvas.width * A4_RATIO);
  let start = 0;
  let page = 0;
  while (start < canvas.height - 2) {
    const limit = start + pagePx;
    let end = Math.min(limit, canvas.height);
    if (limit < canvas.height) {
      const candidate = [...points].reverse().find((p) => p > start + pagePx * 0.35 && p <= limit);
      if (candidate) end = candidate;
    }
    const sliceH = end - start;
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = pagePx;
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, start, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    if (!firstPage || page > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pageW, pageH);
    start = end;
    page += 1;
  }
};

/**
 * Render an offer preview DOM node (fixed width 794 px = A4) into a PDF blob.
 * Breaks pages only between atomic blocks ([data-pdf-block]) so rows and cards
 * are never sliced in half, and honours explicit page containers ([data-pdf-page]).
 */
export const renderOfferPdf = async (node: HTMLElement): Promise<Blob> => {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pages = Array.from(node.querySelectorAll<HTMLElement>("[data-pdf-page]"));
  const targets = pages.length ? pages : [node];
  let first = true;
  for (const target of targets) {
    const { canvas, bg } = await snapshot(target);
    addSlices(pdf, canvas, bg, breakPoints(target, canvas), first);
    first = false;
  }
  return pdf.output("blob");
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const s = String(reader.result || "");
      const idx = s.indexOf(",");
      resolve(idx >= 0 ? s.slice(idx + 1) : s);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });