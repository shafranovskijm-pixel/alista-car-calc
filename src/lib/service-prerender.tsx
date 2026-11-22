import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ServiceDetailContent, ServicesHubContent } from "../components/VehicleServiceContent";
import { SERVICES_HUB_SEO, serviceSeo, type VehicleService } from "./vehicle-services";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

// Static and browser pages share the same content component: no crawler-only copy.
const StaticServiceShell = ({ service }: { service?: VehicleService }) => (
  <div className="public-site relative flex min-h-screen flex-col overflow-clip bg-background">
    <header className="border-b border-border bg-background"><div className="container flex flex-wrap items-center justify-between gap-5 py-5"><a href="/" className="font-heading text-xl font-extrabold tracking-widest text-foreground" aria-label="ALISTA — на главную">ALISTA</a><nav aria-label="Основная навигация" className="flex flex-wrap gap-5 text-sm font-semibold text-foreground"><a href="/cars">Автомобили</a><a href="/services/">Услуги</a><a href="/contacts">Контакты</a></nav></div></header>
    <main className="relative flex-1">{service ? <ServiceDetailContent service={service} /> : <ServicesHubContent />}</main>
    <footer className="border-t border-border py-10"><div className="container flex flex-wrap justify-between gap-5 text-sm text-muted-foreground"><p>ООО «Алиста» · Владивосток</p><a href="tel:+79140730196">+7 914 073-01-96</a><a href="/contacts">Контакты</a><a href="/privacy">Обработка персональных данных</a></div></footer>
  </div>
);

export function renderServiceDocument(template: string, service?: VehicleService): string {
  const seo = service ? serviceSeo(service) : SERVICES_HUB_SEO;
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(seo.title)}</title>`);
  const setMeta = (attribute: "name" | "property", name: string, value: string) => {
    const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${name}["'][^>]*>`, "i");
    const tag = `<meta ${attribute}="${name}" content="${escapeHtml(value)}">`;
    html = pattern.test(html) ? html.replace(pattern, () => tag) : html.replace("</head>", `${tag}\n</head>`);
  };
  const canonical = `https://alistaru.ru${seo.canonicalPath}`;
  setMeta("name", "description", seo.description);
  setMeta("name", "robots", "index, follow");
  setMeta("property", "og:title", seo.title);
  setMeta("property", "og:description", seo.description);
  setMeta("property", "og:url", canonical);
  setMeta("name", "twitter:title", seo.title);
  setMeta("name", "twitter:description", seo.description);
  html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, "");
  html = html.replace("</head>", `<link rel="canonical" href="${escapeHtml(canonical)}">\n</head>`);
  html = html.replace('<html lang="ru">', '<html lang="ru" class="public-site-active dark" style="color-scheme:dark">');
  const root = /<div\s+id=["']root["']\s*><\/div>/;
  if (!root.test(html)) throw new Error("Missing empty React root in build template");
  return html.replace(root, () => `<div id="root">${renderToStaticMarkup(<StaticServiceShell service={service} />)}</div>`);
}
