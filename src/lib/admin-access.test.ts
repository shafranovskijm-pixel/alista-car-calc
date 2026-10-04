import { describe, expect, it } from "vitest";
import {
  canAccessAdminPath,
  hasCatalogAccess,
  hasFullCrmAccess,
  isCatalogOnly,
  type AppRole,
} from "./admin-access";

describe("admin role access", () => {
  it.each<AppRole>(["admin", "manager"])("gives %s full CRM access", (role) => {
    expect(hasFullCrmAccess([role])).toBe(true);
    expect(canAccessAdminPath([role], "/admin/leads")).toBe(true);
    expect(canAccessAdminPath([role], "/admin/cars/new")).toBe(true);
  });

  it("limits a catalog editor to the cars routes", () => {
    const roles: AppRole[] = ["catalog_editor"];

    expect(hasCatalogAccess(roles)).toBe(true);
    expect(isCatalogOnly(roles)).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/cars")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin/cars/new")).toBe(true);
    expect(canAccessAdminPath(roles, "/admin")).toBe(false);
    expect(canAccessAdminPath(roles, "/admin/leads")).toBe(false);
    expect(canAccessAdminPath(roles, "/admin/carousel")).toBe(false);
  });

  it("denies CRM access to authenticated users without an assigned role", () => {
    expect(hasCatalogAccess([])).toBe(false);
    expect(canAccessAdminPath([], "/admin/cars")).toBe(false);
  });

  it("does not reduce access when a full CRM role is also present", () => {
    const roles: AppRole[] = ["manager", "catalog_editor"];

    expect(isCatalogOnly(roles)).toBe(false);
    expect(canAccessAdminPath(roles, "/admin/reports")).toBe(true);
  });
});
