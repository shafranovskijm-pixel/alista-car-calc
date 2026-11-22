import { describe, expect, it } from "vitest";
import { SEO_BY_PATH, getRouteSeo, toCanonicalUrl } from "./seo";
import { VEHICLE_SERVICES, servicePath } from "./vehicle-services";

describe("SEO route configuration", () => {
  it("defines unique metadata for every public static page", () => {
    expect(Object.keys(SEO_BY_PATH)).toEqual([
      "/",
      "/services",
      "/works",
      "/cars",
      "/cars/japan",
      "/cars/korea",
      "/cars/china",
      "/about",
      "/contacts",
      "/privacy",
      "/japan-import-guide",
      ...VEHICLE_SERVICES.map((service) => servicePath(service).replace(/\/$/, "")),
    ]);

    const titles = Object.values(SEO_BY_PATH).map(({ title }) => title);
    expect(new Set(titles).size).toBe(titles.length);
    Object.values(SEO_BY_PATH).forEach((config) => {
      expect(config.canonicalPath).toBeTruthy();
      expect(config.description.length).toBeGreaterThan(60);
    });
    ["/", "/services", "/works", "/about", "/contacts", "/japan-import-guide"].forEach((path) =>
      expect(SEO_BY_PATH[path].robots).toBe("index, follow"),
    );
    ["/cars", "/cars/japan", "/cars/korea", "/cars/china"].forEach((path) =>
      expect(SEO_BY_PATH[path].robots).toBe("noindex, follow"),
    );
    expect(SEO_BY_PATH["/privacy"].robots).toBe("noindex, follow");
  });

  it("keeps admin, redirect, dynamic loading, and missing routes out of the index", () => {
    ["/admin", "/admin/leads", "/calculator", "/cars/example", "/missing", "/services/unknown-service"].forEach(
      (path) => {
        expect(getRouteSeo(path)).toMatchObject({
          canonicalPath: null,
          robots: "noindex, nofollow",
        });
      },
    );
  });

  it("builds canonical URLs on the production origin", () => {
    expect(toCanonicalUrl("/cars/japan")).toBe("https://alistaru.ru/cars/japan");
  });
});
