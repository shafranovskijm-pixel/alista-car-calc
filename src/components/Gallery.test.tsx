import { cleanup, render, screen, within } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPublicCars, type CarWithPhotos } from "@/lib/cars";
import { fetchPublishedWorks } from "@/lib/works";
import Gallery from "./Gallery";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: PropsWithChildren<{ className?: string }>) => (
      <div className={className}>{children}</div>
    ),
  },
}));

vi.mock("@/lib/cars", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/cars")>()),
  fetchPublicCars: vi.fn(),
}));

vi.mock("@/lib/works", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/works")>()),
  fetchPublishedWorks: vi.fn().mockResolvedValue([]),
}));

const toyota: CarWithPhotos = {
  id: "toyota-chr",
  slug: "toyota-c-hr-2020",
  title: "Toyota C-HR",
  brand: "Toyota",
  model: "C-HR",
  year: 2020,
  engine_volume: 1.2,
  power_hp: 116,
  transmission: "cvt",
  fuel: "petrol",
  mileage_km: 52000,
  price: 1450000,
  currency: "RUB",
  country: "japan",
  status: "sold",
  description: null,
  auction_sheet_url: null,
  video_url: null,
  sort_order: 10,
  created_at: "2026-10-04T00:00:00Z",
  updated_at: "2026-10-04T00:00:00Z",
  photos: [
    { id: "interior", car_id: "toyota-chr", url: "/cars/toyota-interior.jpg", sort_order: 0, is_cover: false },
    { id: "cover", car_id: "toyota-chr", url: "/cars/toyota-cover.jpg", sort_order: 1, is_cover: true },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("Gallery public car catalogue", () => {
  it("shows up to six public cars with their own cover, details and catalogue links", async () => {
    const otherCars = Array.from({ length: 6 }, (_, index): CarWithPhotos => ({
      ...toyota,
      id: `other-car-${index}`,
      slug: `other-car-${index}`,
      title: `Другой автомобиль ${index + 1}`,
      status: "in_stock",
      photos: [{ id: `photo-${index}`, car_id: `other-car-${index}`, url: `/cars/other-${index}.jpg`, sort_order: 0, is_cover: true }],
    }));
    vi.mocked(fetchPublicCars).mockResolvedValue([toyota, ...otherCars]);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Gallery />
      </MemoryRouter>,
    );

    const card = await screen.findByRole("link", { name: /Toyota C-HR/ });
    expect(card).toHaveAttribute("href", "/cars/toyota-c-hr-2020");
    expect(within(card).getByRole("img", { name: /Toyota C-HR/ })).toHaveAttribute(
      "src",
      "/cars/toyota-cover.jpg",
    );
    expect(within(card).getByText(/2020/)).toBeInTheDocument();
    expect(within(card).getByText(/Продан/)).toBeInTheDocument();
    expect(within(card).getByText("1 450 000 ₽")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(6);
    expect(screen.queryByRole("link", { name: /Другой автомобиль 6/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Смотреть все автомобили →" })).toHaveAttribute("href", "/cars");
    expect(fetchPublicCars).toHaveBeenCalledTimes(1);
    expect(fetchPublishedWorks).not.toHaveBeenCalled();
  });
});
