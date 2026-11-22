import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { VEHICLE_SERVICES, servicePath } from "../src/lib/vehicle-services";
import { renderServiceDocument } from "../src/lib/service-prerender";

// A Vite hook also runs on hosting builds that call `vite build` directly.
export function prerenderServices(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "alista-prerender-services",
    apply: "build",
    configResolved(resolved) { config = resolved; },
    async closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir);
      const template = await readFile(path.join(outDir, "index.html"), "utf8");
      const routes = [{ pathname: "/services", service: undefined }, ...VEHICLE_SERVICES.map((service) => ({ pathname: servicePath(service), service }))];
      for (const { pathname, service } of routes) {
        const directory = path.join(outDir, pathname.slice(1));
        await mkdir(directory, { recursive: true });
        await writeFile(path.join(directory, "index.html"), renderServiceDocument(template, service), "utf8");
      }
      config.logger.info(`Prerendered ${routes.length} ALISTA service pages with visible HTML and metadata.`);
    },
  };
}
