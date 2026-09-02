import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Header from "./Header";

describe("Header public calculation links", () => {
  it("offers a specialist calculation and no longer links to the calculator", () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "Калькулятор" })).not.toBeInTheDocument();

    const calculationLinks = screen.getAllByRole("link", { name: /Получить расчёт/ });
    expect(calculationLinks.length).toBeGreaterThan(0);
    calculationLinks.forEach((link) => expect(link).toHaveAttribute("href", "/contacts"));
  });
});
