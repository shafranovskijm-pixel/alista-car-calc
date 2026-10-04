import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve("supabase/functions/dadata-party/index.ts"), "utf8");

describe("dadata-party authorization", () => {
  it("authenticates the bearer token and checks the caller's stored roles", () => {
    expect(source).toContain("req.headers.get('Authorization')");
    expect(source).toContain("sb.auth.getUser(token)");
    expect(source).toContain("sb.from('user_roles').select('role').eq('user_id', u.user.id)");
  });

  it("allows only admin and manager roles", () => {
    expect(source).toContain("['admin', 'manager'].includes(r.role)");
    expect(source).not.toContain("['admin', 'manager', 'catalog_editor']");
  });

  it("rejects unauthorized callers before parsing input or calling DaData", () => {
    const authGate = source.indexOf("const auth = await authorize(req)");
    const parseInput = source.indexOf("const { inn } = await req.json()");
    const callDadata = source.indexOf("await fetch('https://suggestions.dadata.ru");

    expect(authGate).toBeGreaterThan(-1);
    expect(source).toContain("auth.error === 'Forbidden' ? 403 : 401");
    expect(authGate).toBeLessThan(parseInput);
    expect(authGate).toBeLessThan(callDadata);
  });
});
