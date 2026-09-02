import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("crawler files", () => {
  it("publishes exactly the known public routes in sitemap.xml", () => {
    const sitemap = readFileSync(resolve("public/sitemap.xml"), "utf8");
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    expect(locations).toEqual([
      "https://alistaru.ru/",
      "https://alistaru.ru/services",
      "https://alistaru.ru/works",
      "https://alistaru.ru/about",
      "https://alistaru.ru/contacts",
    ]);
    expect(sitemap).not.toMatch(/\/admin|\/calculator/);
  });

  it("lets crawlers read noindex directives and points them to the sitemap", () => {
    const robots = readFileSync(resolve("public/robots.txt"), "utf8");
    expect(robots).not.toContain("Disallow: /admin");
    expect(robots).not.toContain("Disallow: /calculator");
    expect(robots).toContain("Sitemap: https://alistaru.ru/sitemap.xml");
  });
});
