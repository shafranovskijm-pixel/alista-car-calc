import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import BuyingGuide from "./BuyingGuide";

afterEach(cleanup);

const renderGuide = () => render(
  <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <BuyingGuide />
  </MemoryRouter>,
);

describe("BuyingGuide", () => {
  it("starts at the first illustrated stage and exposes nine accessible stage buttons", () => {
    renderGuide();

    expect(screen.getByRole("region", { name: "Покупка авто в 9 понятных шагах" })).toHaveAttribute("id", "japan-buying-guide");
    const navigation = screen.getByRole("navigation", { name: "Этапы покупки автомобиля из Японии" });
    expect(within(navigation).getAllByRole("button")).toHaveLength(9);
    const firstButton = within(navigation).getByRole("button", { name: /Шаг 1:/ });
    expect(firstButton).toHaveAttribute("aria-current", "step");
    expect(document.getElementById(firstButton.getAttribute("aria-controls")!)).toBeInTheDocument();
    expect(screen.getByText("Шаг 1 из 9")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Али приветствует клиента/ })).toHaveStyle({ backgroundPosition: "0% 0%" });
    expect(screen.getByRole("button", { name: "Назад" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Дальше" })).toBeEnabled();
  });

  it("lets a client choose a step directly and then go back or forward", () => {
    renderGuide();

    fireEvent.click(screen.getByRole("button", { name: /Шаг 4:/ }));
    expect(screen.getByRole("heading", { level: 3, name: "Выбираем авто и согласовываем сумму с расходами" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /смету расходов/ })).toHaveStyle({ backgroundPosition: "0% 50%" });
    expect(screen.getByRole("button", { name: /Шаг 1:/ })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: /Шаг 4:/ })).toHaveAttribute("aria-current", "step");

    fireEvent.click(screen.getByRole("button", { name: "Назад" }));
    expect(screen.getByRole("heading", { level: 3, name: "Заключаем договор с клиентом" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Дальше" }));
    expect(screen.getByText("Шаг 4 из 9")).toBeInTheDocument();
  });

  it("covers all nine requested stages without cycling beyond the final handover", () => {
    renderGuide();
    const expectedHeadings = [
      "Обращаетесь в компанию «Алиста»",
      "Заказываете подбор автомобиля",
      "Заключаем договор с клиентом",
      "Выбираем авто и согласовываем сумму с расходами",
      "Автомобиль на ярде — готовим к морской перевозке",
      "Выгружаем автомобиль на СВХ",
      "Проходим таможенное оформление",
      "Выпуск авто, приёмка со склада и лаборатория",
      "Передаём ключи клиенту или отправляем через ТК",
    ];

    expectedHeadings.forEach((heading, index) => {
      expect(screen.getByRole("heading", { level: 3, name: heading })).toBeInTheDocument();
      expect(screen.getByText(`Шаг ${index + 1} из 9`)).toBeInTheDocument();
      if (index < 8) fireEvent.click(screen.getByRole("button", { name: "Дальше" }));
    });

    expect(screen.getByRole("img", { name: /вручает ключи/ })).toHaveStyle({ backgroundPosition: "100% 100%" });
    expect(screen.getByText(/отправка через транспортную компанию/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Дальше" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Дальше" }));
    expect(screen.getByText("Шаг 9 из 9")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Обсудить подбор автомобиля" })).toHaveAttribute("href", "/contacts");
  });
});
