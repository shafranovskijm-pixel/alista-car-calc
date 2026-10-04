import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const roleMigration = readFileSync(
  resolve("supabase/migrations/20261004091000_add_catalog_editor_role.sql"),
  "utf8",
);
const accessMigration = readFileSync(
  resolve("supabase/migrations/20261004091100_secure_catalog_editor_access.sql"),
  "utf8",
);
const storageMigration = readFileSync(
  resolve("supabase/migrations/20261004092000_secure_cars_storage_bucket.sql"),
  "utf8",
);
const dealGuardMigrationPath =
  "supabase/migrations/20261004092100_protect_car_deal_links.sql";
const dealGuardMigration = readFileSync(resolve(dealGuardMigrationPath), "utf8");
const publicPhotoMigrationPath =
  "supabase/migrations/20261004092200_public_non_draft_car_photos.sql";
const publicPhotoMigration = readFileSync(
  resolve(publicPhotoMigrationPath),
  "utf8",
);
const roleAssignmentMigration = readFileSync(
  resolve("supabase/migrations/20261004091500_atomic_user_role_assignment.sql"),
  "utf8",
);

describe("catalog editor security migration", () => {
  it("adds the role in a separate migration", () => {
    expect(roleMigration).toContain("ADD VALUE IF NOT EXISTS 'catalog_editor'");
    expect(accessMigration).not.toContain("ALTER TYPE public.app_role");
  });

  it("stops assigning a role from the auth-user trigger", () => {
    const triggerFunction = accessMigration.match(
      /CREATE OR REPLACE FUNCTION public\.handle_new_user\(\)[\s\S]*?\$\$;/,
    )?.[0];

    expect(triggerFunction).toBeDefined();
    expect(triggerFunction).toContain("SET search_path = ''");
    expect(triggerFunction).not.toContain("user_roles");
    expect(triggerFunction).not.toContain("'manager'");
    expect(triggerFunction).not.toContain("'admin'");
  });

  it("grants catalog_editor writes only for cars, car photos and the cars bucket", () => {
    const policiesWithCatalogRole = accessMigration
      .split(/CREATE POLICY /)
      .filter((policy) => policy.includes("'catalog_editor'"));

    expect(policiesWithCatalogRole).toHaveLength(3);
    expect(policiesWithCatalogRole[0]).toContain("ON public.cars");
    expect(policiesWithCatalogRole[1]).toContain("ON public.car_photos");
    expect(policiesWithCatalogRole[2]).toContain("ON storage.objects");
    expect(policiesWithCatalogRole[2]).toContain("bucket_id = 'cars'");
  });

  it("provisions a private image-only cars bucket with a size limit", () => {
    expect(storageMigration).toContain("INSERT INTO storage.buckets");
    expect(storageMigration).toContain("'cars'");
    expect(storageMigration).toContain("10485760");
    expect(storageMigration).toContain("ARRAY['image/jpeg', 'image/png', 'image/webp']");
  });

  it("adds an idempotent cars.deal_id guard after the storage migration", () => {
    const migrationVersion = Number(
      dealGuardMigrationPath.match(/migrations\/(\d+)_/)?.[1],
    );

    expect(migrationVersion).toBeGreaterThan(20261004092000);
    expect(dealGuardMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.protect_car_deal_link_from_catalog_editor()",
    );
    expect(dealGuardMigration).toContain(
      "DROP TRIGGER IF EXISTS protect_car_deal_link_from_catalog_editor ON public.cars",
    );
    expect(dealGuardMigration).toMatch(
      /CREATE TRIGGER protect_car_deal_link_from_catalog_editor\s+BEFORE INSERT OR UPDATE OR DELETE ON public\.cars/,
    );
    expect(dealGuardMigration).toContain(
      "REVOKE ALL ON FUNCTION public.protect_car_deal_link_from_catalog_editor()",
    );
  });

  it("blocks only catalog-only users from assigning or changing cars.deal_id", () => {
    const guardFunction = dealGuardMigration.match(
      /CREATE OR REPLACE FUNCTION public\.protect_car_deal_link_from_catalog_editor\(\)[\s\S]*?\$\$;/,
    )?.[0];
    const normalized = dealGuardMigration.replace(/\s+/g, " ");

    expect(guardFunction).toBeDefined();
    expect(guardFunction).not.toContain("SECURITY DEFINER");
    expect(normalized).toContain("current_user = 'authenticated'");
    expect(normalized).toContain(
      "public.has_role(actor_id, 'catalog_editor'::public.app_role)",
    );
    expect(normalized).toContain(
      "NOT public.has_role(actor_id, 'admin'::public.app_role)",
    );
    expect(normalized).toContain(
      "NOT public.has_role(actor_id, 'manager'::public.app_role)",
    );
    expect(normalized).toContain("TG_OP = 'INSERT' AND NEW.deal_id IS NOT NULL");
    expect(normalized).toContain(
      "TG_OP = 'UPDATE' AND NEW.deal_id IS DISTINCT FROM OLD.deal_id",
    );
    expect(normalized).toContain("TG_OP = 'DELETE' AND OLD.deal_id IS NOT NULL");
    expect(normalized).toContain("IF TG_OP = 'DELETE' THEN RETURN OLD");
    expect(normalized).toContain("ERRCODE = '42501'");
  });

  it("allows signed URLs only for referenced photos of non-draft cars", () => {
    const migrationVersion = Number(
      publicPhotoMigrationPath.match(/migrations\/(\d+)_/)?.[1],
    );
    const policy = publicPhotoMigration
      .split('CREATE POLICY "Public read non-draft car photos"')[1]
      ?.replace(/\s+/g, " ");

    expect(migrationVersion).toBeGreaterThan(20261004092100);
    expect(publicPhotoMigration).toContain(
      'DROP POLICY IF EXISTS "Anon read car photos for public catalog" ON storage.objects',
    );
    expect(publicPhotoMigration).toContain(
      'DROP POLICY IF EXISTS "Authenticated read car photos" ON storage.objects',
    );
    expect(publicPhotoMigration).toContain(
      'DROP POLICY IF EXISTS "Public read non-draft car photos" ON storage.objects',
    );
    expect(publicPhotoMigration).toContain(
      "CREATE INDEX IF NOT EXISTS car_photos_url_idx ON public.car_photos (url)",
    );
    expect(policy).toBeDefined();
    expect(policy).toMatch(/ON storage\.objects FOR SELECT TO anon, authenticated USING/);
    expect(policy).toContain("bucket_id = 'cars'");
    expect(policy).toContain("FROM public.car_photos AS photo");
    expect(policy).toContain("JOIN public.cars AS car ON car.id = photo.car_id");
    expect(policy).toContain("photo.url = storage.objects.name");
    expect(policy).toContain("car.status <> 'draft'");
    expect(policy).not.toContain("split_part");
  });

  it("replaces a user's role atomically through a service-role-only function", () => {
    expect(roleAssignmentMigration).toContain("CREATE OR REPLACE FUNCTION public.replace_user_role");
    expect(roleAssignmentMigration).toContain("SET search_path = ''");
    expect(roleAssignmentMigration).toContain("INSERT INTO public.user_roles");
    expect(roleAssignmentMigration).toContain("ON CONFLICT (user_id) DO UPDATE");
    expect(roleAssignmentMigration).toContain("pg_advisory_xact_lock");
    expect(roleAssignmentMigration).toContain("existing_role public.app_role");
    expect(roleAssignmentMigration).not.toContain("current_role public.app_role");
    expect(roleAssignmentMigration).toContain("Нельзя изменить роль последнего администратора");
    expect(roleAssignmentMigration).toContain("UNIQUE (user_id)");
    expect(roleAssignmentMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(roleAssignmentMigration).toContain("TO service_role");
  });
});
