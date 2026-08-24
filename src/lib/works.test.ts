import { describe, expect, it } from "vitest";
import {
  getPublicWorkTitle,
  mergeSplitWorks,
  preparePublishedWorks,
  type WorkPhoto,
  type WorkWithPhotos,
} from "./works";

const photo = (id: string, workId: string, sortOrder: number, isCover = sortOrder === 0): WorkPhoto => ({
  id,
  work_id: workId,
  url: `/images/${id}.jpg`,
  sort_order: sortOrder,
  is_cover: isCover,
});

const work = (
  id: string,
  sourceDate: string,
  photos: WorkPhoto[],
  overrides: Partial<WorkWithPhotos> = {},
): WorkWithPhotos => ({
  id,
  slug: id,
  title: "VOLKSWAGEN T-ROC 2022 280TSI DSG COMFORT SMART",
  brand: "Volkswagen",
  model: "T-Roc",
  year: 2022,
  price: 1_841_000,
  country: "Китай",
  description: null,
  status: "published",
  sort_order: Number(id.replace(/\D/g, "")) || 0,
  source_date: sourceDate,
  created_at: sourceDate,
  updated_at: sourceDate,
  photos,
  ...overrides,
});

describe("mergeSplitWorks", () => {
  it("joins adjacent fragments and uses the fuller exterior gallery as the primary record", () => {
    const detailOnly = work("work-45", "2026-06-03T17:07:33Z", [
      photo("dashboard", "work-45", 0),
      photo("detail", "work-45", 1, false),
    ]);
    const exteriorGallery = work(
      "work-44",
      "2026-06-03T17:07:32Z",
      Array.from({ length: 8 }, (_, index) => photo(`exterior-${index}`, "work-44", index)),
    );

    const result = mergeSplitWorks([detailOnly, exteriorGallery]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("work-44");
    expect(result[0].sort_order).toBe(45);
    expect(result[0].photos).toHaveLength(10);
    expect(result[0].photos[0].id).toBe("exterior-0");
    expect(result[0].photos.filter((item) => item.is_cover)).toHaveLength(1);
  });

  it("keeps separate publications of the same model when they are not source fragments", () => {
    const first = work("work-10", "2026-06-03T17:07:00Z", [photo("first", "work-10", 0)]);
    const later = work("work-9", "2026-06-03T17:08:00Z", [photo("later", "work-9", 0)]);

    expect(mergeSplitWorks([first, later])).toHaveLength(2);
  });

  it("does not merge adjacent rows when the price differs", () => {
    const first = work("work-2", "2026-06-03T17:07:33Z", [photo("first", "work-2", 0)]);
    const differentPrice = work(
      "work-1",
      "2026-06-03T17:07:32Z",
      [photo("second", "work-1", 0)],
      { price: 1_900_000 },
    );

    expect(mergeSplitWorks([first, differentPrice])).toHaveLength(2);
  });
});

describe("published works cleanup", () => {
  it("removes every gallery that was visually verified against the wrong vehicle", () => {
    const mismatchedIds = [
      "b2335ab5-a471-4c20-bfca-95e39b4d2aa1",
      "8c984f57-2f01-49b3-b04a-60c64b0a7526",
      "aaed8932-6838-4d12-bc36-6f1fda80fd43",
      "89128f35-813e-4806-b9f7-144441587ecf",
      "f76a1e70-367e-469e-b5af-ee61d14ed9b0",
      "1aec1e54-794b-4f4b-ad56-23290c2469e0",
      "7f54b146-a271-48d2-b9c7-384a816369fc",
      "493c964b-f958-428d-a8f0-8d2d59043673",
      "8353ed47-6488-4c1b-9f06-74b1c99865df",
      "b57108d6-777c-4f53-8ff4-f2c314c82138",
    ];
    const mismatched = mismatchedIds.map((id, index) =>
      work(id, `2026-05-01T00:00:${String(index).padStart(2, "0")}Z`, [photo(`wrong-${index}`, id, 0)]),
    );

    expect(preparePublishedWorks(mismatched)).toEqual([]);
  });

  it("keeps the visually correct Suzuki gallery and restores its model name", () => {
    const wrongToyotaGallery = work(
      "89128f35-813e-4806-b9f7-144441587ecf",
      "2026-05-26T01:27:12Z",
      [photo("toyota", "89128f35-813e-4806-b9f7-144441587ecf", 0)],
      {
        title: "T 4WD F",
        description: "Suzuki Vitara 1.4T 4WD Flagship Edition Производство: 2017.11",
      },
    );
    const correctSuzukiGallery = work(
      "16ba8789-0d90-48d0-a41e-897a61b4c0eb",
      "2026-05-26T01:13:20Z",
      [photo("suzuki", "16ba8789-0d90-48d0-a41e-897a61b4c0eb", 0)],
      {
        title: "T 4WD F",
        description: "Suzuki Vitara 1.4T 4WD Flagship Edition Производство: 2017.11",
      },
    );

    const result = preparePublishedWorks([wrongToyotaGallery, correctSuzukiGallery]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("16ba8789-0d90-48d0-a41e-897a61b4c0eb");
    expect(result[0].title).toBe("Suzuki Vitara 1.4T 4WD Flagship Edition");
    expect(result[0].photos[0].id).toBe("suzuki");
  });

  it("replaces generic and over-captured titles with a model stated in the description", () => {
    const hyundai = work("work-41", "2026-06-01T16:37:35Z", [], {
      title: "Авто под заказ",
      description: "🚘 Hyundai Kona🖇️ КОМПЛЕКТАЦИЯ : Modern🗓️Год выпуска: 2022/01г.",
    });
    const skoda = work("work-21", "2026-05-20T18:22:11Z", [], {
      title: "SKODA KAMIQ 1.5L COMFORT EDITIONДата выпуска: 2023.07Мотор: 1.5Л",
      description: "🚘 SKODA KAMIQ 1.5L COMFORT EDITIONДата выпуска: 2023.07Мотор: 1.5Л",
    });
    const toyota = work("work-36", "2026-05-28T22:30:55Z", [], {
      title: "Авто под заказ",
      description: "Поздравляем с приобретением отличного автомобиля -Toyota Vios. Этот красавец уже у владельца.",
    });

    expect(getPublicWorkTitle(hyundai)).toBe("Hyundai Kona");
    expect(getPublicWorkTitle(skoda)).toBe("SKODA KAMIQ 1.5L COMFORT EDITION");
    expect(getPublicWorkTitle(toyota)).toBe("Toyota Vios");
  });
});

