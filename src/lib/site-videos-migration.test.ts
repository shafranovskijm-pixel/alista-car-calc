import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve("supabase/migrations/20261012103000_site_videos.sql"), "utf8");

describe("site videos migration security and seeds", () => {
  it("allows public reads only for published rows", () => {
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("FOR SELECT TO anon, authenticated USING (is_published = true)");
    expect(migration).toContain("GRANT SELECT ON public.site_videos TO anon");
    expect(migration).not.toMatch(/GRANT (?:ALL|INSERT|UPDATE|DELETE)[^;]*TO anon/);
  });

  it("uses the existing catalogue roles in both USING and WITH CHECK", () => {
    const staffPolicy = migration.split('CREATE POLICY "Catalog staff manage site videos"')[1].split("DROP TRIGGER")[0];
    expect(staffPolicy).toContain("FOR ALL TO authenticated");
    for (const role of ["admin", "manager", "catalog_editor"]) {
      expect(staffPolicy.match(new RegExp(`public\\.has_role\\(auth\\.uid\\(\\), '${role}'\\)`, "g"))).toHaveLength(2);
    }
    expect(staffPolicy).toContain("WITH CHECK");
    expect(migration).not.toContain("ON public.deals");
    expect(migration).not.toContain("ON public.clients");
  });

  it("seeds verified video IDs once without overriding visibility or pricing", () => {
    const seed = migration.split("INSERT INTO public.site_videos")[1];
    expect(seed).toContain("Fc-XxnLPPTQ");
    expect(seed).toContain("VZqSnqRDcsg");
    expect(seed).toContain("f5N6IGsVeHc");
    expect(seed).toContain("ON CONFLICT DO NOTHING");
    expect(seed).not.toContain("DO UPDATE");
    expect(seed).not.toContain("₽");
    expect(migration).toContain("video_url text NOT NULL UNIQUE");
  });
});
