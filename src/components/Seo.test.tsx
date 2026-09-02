import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Seo from "./Seo";

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('link[rel="canonical"]').forEach((element) => element.remove());
});

describe("Seo", () => {
  it("updates title, description, robots, canonical and social metadata", async () => {
    const { rerender } = render(
      <Seo
        title="Автомобили из Японии | ALISTA"
        description="Описание страницы Японии"
        canonicalPath="/cars/japan"
      />,
    );

    await waitFor(() => expect(document.title).toBe("Автомобили из Японии | ALISTA"));
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Описание страницы Японии",
    );
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "index, follow",
    );
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://alistaru.ru/cars/japan",
    );
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "https://alistaru.ru/cars/japan",
    );
    expect(document.querySelector('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://alistaru.ru/og-image.jpg",
    );

    rerender(
      <Seo
        title="CRM ALISTA"
        description="Внутренняя система"
        canonicalPath={null}
        robots="noindex, nofollow"
      />,
    );

    await waitFor(() =>
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex, nofollow",
      ),
    );
    expect(document.querySelector('link[rel="canonical"]')).not.toBeInTheDocument();
  });
});
