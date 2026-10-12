import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPublicCars, type CarWithPhotos } from "@/lib/cars";
import CarsPage from "./Cars";

vi.mock("framer-motion", () => ({ motion: { div: ({ children }: PropsWithChildren) => <div>{children}</div> } }));
vi.mock("@/components/Layout", () => ({ default: ({ children }: PropsWithChildren) => <>{children}</> }));
vi.mock("@/components/PageTransition", () => ({ default: ({ children }: PropsWithChildren) => <>{children}</> }));
vi.mock("@/components/Seo", () => ({ default: () => null }));
vi.mock("@/lib/cars", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/cars")>()), fetchPublicCars: vi.fn() }));

const toyota: CarWithPhotos = {
  id: "toyota", slug: "toyota-c-hr", title: "Toyota C-HR", brand: "Toyota", model: "C-HR", year: 2020,
  engine_volume: 1.2, power_hp: null, transmission: "cvt", fuel: "petrol", mileage_km: 79000,
  price: 1634000, currency: "RUB", country: "japan", status: "sold", description: "Полный привод",
  auction_sheet_url: null, video_url: null, sort_order: 1, created_at: "2026-10-01", updated_at: "2026-10-01", photos: [],
};
const honda = { ...toyota, id: "honda", slug: "honda-fit", brand: "Honda", model: "Fit", title: "Honda Fit", status: "in_stock" as const, country: "china" as const };
const Location = () => <output data-testid="location">{useLocation().search}</output>;
const mount = (entry = "/cars") => render(<MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CarsPage /><Location /></MemoryRouter>);
beforeEach(() => { vi.clearAllMocks(); vi.mocked(fetchPublicCars).mockResolvedValue([toyota, honda, { ...toyota, id: "draft", slug: "secret-draft", title: "Секретный черновик", status: "draft" }]); });
afterEach(cleanup);

describe("customer car catalogue", () => {
  it("loads a home search query, finds matching published cars and excludes drafts", async () => {
    mount("/cars?q=%D0%A2%D0%BE%D0%B9%D0%BE%D1%82%D0%B0+CHR");
    expect(await screen.findByRole("link", { name: /Toyota C-HR/ })).toHaveAttribute("href", "/cars/toyota-c-hr");
    expect(screen.queryByRole("link", { name: /Honda Fit/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Секретный черновик")).not.toBeInTheDocument();
    expect(screen.getByText("Найдено: 1")).toBeInTheDocument();
  });
  it("filters status and model, stores shareable parameters and resets", async () => {
    mount();
    await screen.findByRole("link", { name: /Toyota C-HR/ });
    fireEvent.change(screen.getByLabelText("Наличие"), { target: { value: "in_stock" } });
    expect(screen.queryByRole("link", { name: /Toyota C-HR/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Honda Fit/ })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("status=in_stock");
    fireEvent.click(screen.getByRole("button", { name: "Сбросить" }));
    expect(screen.getByText("Найдено: 2")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toBeEmptyDOMElement();
  });
  it("updates results for new CRM rows when returning to the tab", async () => {
    vi.mocked(fetchPublicCars).mockResolvedValueOnce([toyota]).mockResolvedValueOnce([toyota, honda]);
    mount();
    await screen.findByRole("link", { name: /Toyota C-HR/ });
    fireEvent(window, new Event("focus"));
    await waitFor(() => expect(screen.getByRole("link", { name: /Honda Fit/ })).toBeInTheDocument());
    expect(fetchPublicCars).toHaveBeenCalledTimes(2);
  });
  it("shows a useful no-results state and validates inverted ranges", async () => {
    mount("/cars?yearFrom=2024&yearTo=2018");
    await screen.findByText("По вашему запросу ничего не найдено. Измените запрос или фильтры.");
    expect(screen.getByRole("alert")).toHaveTextContent("от");
    fireEvent.click(screen.getByRole("button", { name: "Сбросить поиск и фильтры" }));
    expect(screen.getByText("Найдено: 2")).toBeInTheDocument();
  });
  it("country navigation removes an old country filter but keeps the search", async () => {
    mount("/cars?country=korea&q=Toyota&status=sold");
    await screen.findByText("Найдено: 0");
    expect(screen.getByRole("link", { name: "Япония" })).toHaveAttribute("href", "/cars/japan?q=Toyota&status=sold");
    expect(screen.getByRole("link", { name: "Все страны" })).toHaveAttribute("href", "/cars?q=Toyota&status=sold");
  });
});
