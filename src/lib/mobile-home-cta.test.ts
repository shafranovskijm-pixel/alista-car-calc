import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile home CTA layout", () => {
  it("lets the CTA grid and its children shrink to the mobile viewport", () => {
    const page = readFileSync(resolve("src/pages/Index.tsx"), "utf8");

    expect(page).toContain(
      "relative grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[1fr_0.82fr]",
    );
    expect(page).toContain('<div className="min-w-0"><p className="text-sm font-bold uppercase');
    expect(page).toContain(
      '<div className="min-w-0 rounded-[1.5rem] border border-primary/20',
    );
  });

  it("allows a long submit label to wrap instead of widening the form", () => {
    const form = readFileSync(resolve("src/components/LeadForm.tsx"), "utf8");

    expect(form).toContain('className={`min-w-0 ${compact ? "space-y-3" : "space-y-4"}`}');
    expect(form).toContain("h-auto min-h-10 w-full whitespace-normal py-2 text-center");
  });
});
