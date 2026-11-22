import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getRouteSeo } from "./seo";
import { renderServiceDocument } from "./service-prerender";
import { CUSTOMS_SERVICES, VEHICLE_SERVICES, servicePath } from "./vehicle-services";

// Independent checklist transcribed from the supplied ALISTA cards.
const expectedNames = ["Утепление капота", "Шумоизоляция дверей", "Шумоизоляция колёсных арок", "Шумоизоляция пола", "Шумоизоляция багажного отделения", "Перетяжка салона в экокожу", "Подогрев сидений", "Вентиляция сидений", "Подогрев руля", "Подогрев зеркал", "Подогрев зоны дворников", "Багажные системы"];
const template = readFileSync("index.html", "utf8");
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

describe("services from ALISTA cards", () => {
  it("includes the entire photographed list, with unique useful pages", () => {
    expect(VEHICLE_SERVICES.map((service) => service.name)).toEqual(expectedNames);
    expect(new Set(VEHICLE_SERVICES.map(servicePath)).size).toBe(12);
    expect(new Set(VEHICLE_SERVICES.map((service) => service.description)).size).toBe(12);
  });

  it("exposes all twelve detail links and the existing customs services without JavaScript", () => {
    const doc = parse(renderServiceDocument(template));
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    VEHICLE_SERVICES.forEach((service) => {
      expect(doc.querySelector(`a[href="${servicePath(service)}"]`)?.textContent).toContain(service.name);
    });
    expect(CUSTOMS_SERVICES).toHaveLength(6);
    CUSTOMS_SERVICES.forEach((service) => expect(doc.body.textContent).toContain(service.title));
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://alistaru.ru/services/");
  });

  it.each(VEHICLE_SERVICES)("prepares indexable HTML and consistent metadata for $slug", (service) => {
    const doc = parse(renderServiceDocument(template, service));
    const seo = getRouteSeo(`${servicePath(service)}/`);
    expect(doc.querySelectorAll("title")).toHaveLength(1);
    expect(doc.title).toBe(seo.title);
    expect(doc.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(doc.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(seo.description);
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("index, follow");
    expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`https://alistaru.ru${servicePath(service)}`);
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(`https://alistaru.ru${servicePath(service)}`);
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.querySelector("h1")?.textContent).toBe(`${service.name} во Владивостоке`);
    service.paragraphs.forEach((paragraph) => expect(doc.querySelector("main")?.textContent).toContain(paragraph));
    service.faq.forEach(({ question, answer }) => {
      expect(doc.querySelector("main")?.textContent).toContain(question);
      expect(doc.querySelector("main")?.textContent).toContain(answer);
    });
    const graphs = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((script) => JSON.parse(script.textContent!));
    const graph = graphs.find((item) => item["@graph"])["@graph"];
    expect(graph.find((item: { "@type": string }) => item["@type"] === "Service").name).toBe(service.name);
    expect(graph.find((item: { "@type": string }) => item["@type"] === "BreadcrumbList").itemListElement.at(-1).item).toBe(`https://alistaru.ru${servicePath(service)}`);
    expect(doc.querySelector('#service-request a[href="/contacts"]')).toBeTruthy();
    expect(doc.querySelector('a[href="tel:+79140730196"]')).toBeTruthy();
    expect(doc.querySelector('script[type="module"]')?.getAttribute("src")).toBe("/src/main.tsx");
  });

  it("does not invent a luggage product catalogue when the detailed card is missing", () => {
    const luggage = VEHICLE_SERVICES.find((service) => service.group === "luggage")!;
    expect(luggage.paragraphs.join(" ")).toContain("менеджер подтверждает");
    expect(JSON.stringify(luggage)).not.toMatch(/фаркоп|рейлинг|автобокс|в наличии|гарантия|\d+\s*₽/i);
  });
});
