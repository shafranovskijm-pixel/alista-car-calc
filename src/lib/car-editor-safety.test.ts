import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const listSource = readFileSync(resolve("src/pages/admin/AdminCars.tsx"), "utf8");
const editorSource = readFileSync(resolve("src/pages/admin/AdminCarEdit.tsx"), "utf8");

describe("catalog draft safety", () => {
  it("creates an empty draft instead of a misleading public-ready placeholder", () => {
    expect(listSource).toMatch(
      /\.insert\(\{[\s\S]*?title: ""[\s\S]*?brand: ""[\s\S]*?model: ""[\s\S]*?status: "draft"/,
    );
  });

  it("opens a draft in the editor instead of publishing it from the list", () => {
    expect(listSource).toMatch(
      /if \(c\.status === "draft"\)[\s\S]*?navigate\(`\/admin\/cars\/\$\{c\.id\}`\)[\s\S]*?return/,
    );
  });

  it("requires a photo before saving a public status", () => {
    expect(editorSource).toMatch(
      /status !== "draft" && photos\.length === 0[\s\S]*?Перед публикацией добавьте хотя бы одну фотографию/,
    );
  });

  it("deletes database rows before best-effort storage cleanup", () => {
    const deleteCarPosition = editorSource.indexOf('.from("cars").delete()');
    const cleanupPosition = editorSource.indexOf('.storage.from("cars").remove(keys)', deleteCarPosition);
    expect(deleteCarPosition).toBeGreaterThan(-1);
    expect(cleanupPosition).toBeGreaterThan(deleteCarPosition);
  });
});
