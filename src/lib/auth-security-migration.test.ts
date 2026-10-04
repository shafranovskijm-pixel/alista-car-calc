import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const inviteOnlyMigration = readFileSync(
  resolve("supabase/migrations/20261004093000_invite_only_auth_users.sql"),
  "utf8",
);
const teamFunction = readFileSync(resolve("supabase/functions/team/index.ts"), "utf8");
const resetPasswordPage = readFileSync(resolve("src/pages/admin/ResetPassword.tsx"), "utf8");
const adminSettingsPage = readFileSync(resolve("src/pages/admin/AdminSettings.tsx"), "utf8");

describe("invite-only auth migration", () => {
  it("checks the final server-owned auth.users.invited_at value", () => {
    expect(inviteOnlyMigration).toMatch(
      /SELECT auth_user\.invited_at[\s\S]*?FROM auth\.users AS auth_user[\s\S]*?WHERE auth_user\.id = NEW\.id/,
    );
    expect(inviteOnlyMigration).toMatch(
      /IF user_invited_at IS NULL THEN[\s\S]*?RAISE EXCEPTION[\s\S]*?ERRCODE = '42501'/,
    );
  });

  it("defers the insert check so GoTrue can set invited_at in its invite transaction", () => {
    expect(inviteOnlyMigration).toMatch(
      /CREATE CONSTRAINT TRIGGER on_auth_user_created[\s\S]*?AFTER INSERT ON auth\.users[\s\S]*?DEFERRABLE INITIALLY DEFERRED[\s\S]*?EXECUTE FUNCTION public\.handle_new_user\(\)/,
    );
  });

  it("keeps the application invite path on the trusted Auth Admin API", () => {
    expect(teamFunction).toContain("sb.auth.admin.inviteUserByEmail");
    expect(teamFunction).toContain("/admin/reset-password");
    expect(inviteOnlyMigration).toContain(
      "REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated",
    );
  });

  it("does not delete an administrator directly", () => {
    expect(teamFunction).toContain("Сначала измените роль администратора");
    expect(teamFunction).toMatch(
      /targetRoles[\s\S]*?role === 'admin'[\s\S]*?sb\.auth\.admin\.deleteUser/,
    );
  });

  it("keeps the invite password form open after the Auth client consumes the callback hash", () => {
    expect(resetPasswordPage).toContain("supabase.auth.getSession()");
    expect(resetPasswordPage).toContain("supabase.auth.onAuthStateChange");
    expect(resetPasswordPage).toContain('event === "PASSWORD_RECOVERY"');
    expect(resetPasswordPage).toContain('event === "SIGNED_IN"');
    expect(resetPasswordPage).toContain('navigate("/admin", { replace: true })');
  });

  it("shows team management only to administrators", () => {
    expect(adminSettingsPage).toContain('const isAdmin = roles.includes("admin")');
    expect(adminSettingsPage).toContain(
      'requestedTab === "team" && !isAdmin ? "profile" : requestedTab',
    );
    expect(adminSettingsPage).toMatch(
      /\{isAdmin && <TabsTrigger value="team">Команда<\/TabsTrigger>\}/,
    );
  });
});
