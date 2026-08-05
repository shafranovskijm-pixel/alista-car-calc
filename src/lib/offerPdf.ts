import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const PAGE_W = 794;
const PAGE_H = 1123;

const bgOf = (el: HTMLElement): string => {
  let cur: HTMLElement | null = el;
  while (cur) {
    const bg = getComputedStyle(cur).backgroundColor;
    if (bg && bg !== "transparent" && !bg.startsWith("rgba(0, 0, 0, 0)")) return bg;
    cur = cur.parentElement;
  }
  return "#ffffff";
};

/** Neutralise everything that breaks html2canvas rasterisation. */
const normalise = (root: HTMLElement) => {
  root.querySelectorAll<HTMLElement>("[data-pdf-decor]").forEach((el) => el.remove());
  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
  all.forEach((el) => {
    el.style.transition = "none";
    el.style.animation = "none";
    el.style.backdropFilter = "none";
    (el.style as unknown as Record<string, string>).webkitBackdropFilter = "none";
    const cs = getComputedStyle(el);
    if (cs.transform && cs.transform !== "none") el.style.transform = "none";
    if (cs.filter && cs.filter !== "none") el.style.filter = "none";
  });
};

const waitAssets = async (root: HTMLElement) => {
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* ignore */
  }
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      try {
        if (typeof img.decode === "function") await img.decode();
        else if (!img.complete)
          await new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          });
      } catch {
        /* a single broken image must not abort the export */
      }
    }),
  );
  // let layout settle
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
};

/** Build the off-screen host holding a real clone of the document. */
const mountClone = (node: HTMLElement) => {
  const host = document.createElement("div");
  host.className = "pdf-export-mode";
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;transform:none;zoom:1;max-height:none;height:auto;overflow:visible;opacity:1;visibility:visible;background:#ffffff;z-index:-1;pointer-events:none;";
  const clone = node.cloneNode(true) as HTMLElement;
  clone.style.cssText += ";width:794px;transform:none;zoom:1;max-height:none;height:auto;overflow:visible;margin:0;";
  host.appendChild(clone);
  document.body.appendChild(host);
  normalise(clone);
  return { host, clone };
};

const applyLaterPageChrome = (page: HTMLElement) => {
  page.querySelectorAll<HTMLElement>("[data-pdf-page-header]").forEach((el) => el.remove());
  page.querySelectorAll<HTMLElement>("[data-pdf-compact-header]").forEach((el) => {
    el.style.display = "";
    el.removeAttribute("hidden");
  });
};

/**
 * Split a page element into real A4 DOM pages by moving atomic flow blocks.
 * Requires a [data-pdf-flow] container; blocks marked [data-pdf-repeat]
 * (e.g. table headers) are re-inserted at the top of each continuation page.
 */
const paginate = (host: HTMLElement, page: HTMLElement): HTMLElement[] => {
  const flow = page.querySelector<HTMLElement>("[data-pdf-flow]");
  if (!flow) return [page];
  if (page.scrollHeight <= PAGE_H + 2) return [page];

  const items = Array.from(flow.children) as HTMLElement[];
  const skeleton = page.cloneNode(true) as HTMLElement;
  skeleton.querySelector<HTMLElement>("[data-pdf-flow]")!.innerHTML = "";

  const pages: HTMLElement[] = [];
  let repeat: HTMLElement | null = null;

  const newPage = (): { el: HTMLElement; flow: HTMLElement } => {
    const el = skeleton.cloneNode(true) as HTMLElement;
    if (pages.length > 0) applyLaterPageChrome(el);
    const f = el.querySelector<HTMLElement>("[data-pdf-flow]")!;
    host.appendChild(el);
    pages.push(el);
    if (pages.length > 1 && repeat) f.appendChild(repeat.cloneNode(true));
    return { el, flow: f };
  };

  let current = newPage();
  items.forEach((item) => {
    if (item.hasAttribute("data-pdf-repeat")) repeat = item;
    current.flow.appendChild(item);
    if (current.el.scrollHeight > PAGE_H + 2 && current.flow.children.length > 1) {
      current.flow.removeChild(item);
      current = newPage();
      current.flow.appendChild(item);
    }
  });

  page.remove();
  return pages;
};

const stampPageNumbers = (pages: HTMLElement[]) => {
  pages.forEach((p, i) => {
    p.querySelectorAll<HTMLElement>("[data-pdf-pageno]").forEach((el) => {
      el.textContent = `${i + 1} / ${pages.length}`;
      el.style.display = pages.length > 1 ? "" : "none";
    });
  });
};

const capture = async (el: HTMLElement) =>
  html2canvas(el, {
    scale: 3,
    backgroundColor: bgOf(el),
    useCORS: true,
    allowTaint: false,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: PAGE_W,
    windowHeight: Math.max(PAGE_H, el.scrollHeight),
    width: PAGE_W,
    height: Math.max(PAGE_H, el.scrollHeight),
  });

/** Render an offer preview DOM node (794 px wide = A4) into a PDF blob. */
export const renderOfferPdf = async (node: HTMLElement): Promise<Blob> => {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const { host, clone } = mountClone(node);

  try {
    await waitAssets(clone);

    const declared = Array.from(clone.querySelectorAll<HTMLElement>("[data-pdf-page]"));
    const roots = declared.length ? declared : [clone];
    let pages: HTMLElement[] = [];
    roots.forEach((r) => {
      pages = pages.concat(paginate(host, r));
    });
    stampPageNumbers(pages);
    await waitAssets(clone);

    let first = true;
    for (const page of pages) {
      const canvas = await capture(page);
      const slices = Math.max(1, Math.ceil(canvas.height / (canvas.width * (PAGE_H / PAGE_W)) - 0.02));
      const slicePx = Math.ceil(canvas.height / slices);
      for (let s = 0; s < slices; s++) {
        const start = s * slicePx;
        const h = Math.min(slicePx, canvas.height - start);
        if (h < 4) continue;
        const out = document.createElement("canvas");
        out.width = canvas.width;
        out.height = slicePx;
        const ctx = out.getContext("2d")!;
        ctx.fillStyle = bgOf(page);
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(canvas, 0, start, canvas.width, h, 0, 0, canvas.width, h);
        if (!first) pdf.addPage();
        first = false;
        pdf.addImage(out.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH);
      }
    }
    return pdf.output("blob");
  } finally {
    host.remove();
  }
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
