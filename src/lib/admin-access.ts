export type AppRole = "admin" | "manager" | "catalog_editor";

export const hasFullCrmAccess = (roles: readonly AppRole[]) =>
  roles.includes("admin") || roles.includes("manager");

export const hasCatalogAccess = (roles: readonly AppRole[]) =>
  hasFullCrmAccess(roles) || roles.includes("catalog_editor");

export const isCatalogOnly = (roles: readonly AppRole[]) =>
  roles.includes("catalog_editor") && !hasFullCrmAccess(roles);

export const canAccessAdminPath = (roles: readonly AppRole[], pathname: string) => {
  if (hasFullCrmAccess(roles)) return true;
  return roles.includes("catalog_editor") && /^\/admin\/cars(?:\/|$)/.test(pathname);
};
