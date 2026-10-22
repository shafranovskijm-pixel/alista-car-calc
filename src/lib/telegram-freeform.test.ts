import { describe, expect, it } from "vitest";
import { parseCarPost } from "../../supabase/functions/_shared/telegram-parse";

const NOW = new Date("2026-10-22");
const ok = (t: string) => {
  const r = parseCarPost(t, NOW);
  if (r.kind !== "ok") throw new Error(JSON.stringify(r));
  return r.car;
};

describe("free-form channel posts", () => {
  it("parses post /172 (Peugeot from Korea) without guessing gearbox", () => {
    const c = ok(`Доступен к заказу из Кореи 🇰🇷
Peugeot 308 - 2021г. ЛЕВЫЙ РУЛЬ
🏃‍♂️ Пробег - 40 000 км
🎬 Мотор 1.6t дизель 2wd 120 л.с.
💪 передний привод
цена данного автомобиля под ключ с растаможкой и утилём 1.650.000 ₽`);
    expect(c).toMatchObject({ brand: "Peugeot", model: "308", year: 2021, country: "korea", price: 1650000, currency: "RUB",
      mileage_km: 40000, fuel: "diesel", engine_volume: 1.6, power_hp: 120, transmission: null, status: "on_order" });
  });

  it("parses post /182 (Toyota Yaris L from China)", () => {
    const c = ok(`Toyota Yaris L 1.5L X Luxury Plus Edition 🇨🇳
Компактный, надежный и экономичный городской седан от Toyota. Yaris L Дата производства: 09.2022
🛣 Пробег: 45 000 км
⚙️ Двигатель: 1.5 бензин (112 л.с.)
🚗 Привод: Передний
🔄 Трансмиссия: Вариатор (CVT)
🔑 Ключей: 2
☑ Состояние: заявлен оригинальный окрас кузова без замен кузовных элементов
💵 Стоимость под ключ до Владивостока-1 460 000 ₽`);
    expect(c).toMatchObject({ brand: "Toyota", model: "Yaris L", year: 2022, country: "china", price: 1460000, currency: "RUB",
      mileage_km: 45000, transmission: "cvt", fuel: "petrol", engine_volume: 1.5, power_hp: 112 });
    expect(c.title).toBe("Toyota Yaris L 1.5L X Luxury Plus Edition");
  });

  it("ignores contact post /181", () => {
    expect(parseCarPost("Почта alistaauto@mail.ru Whatsapp +79140730196 Для расчёта и подбора 📲", NOW).kind).toBe("ignored");
  });

  it("skips a collection of several cars (/191) with a reason", () => {
    const r = parseCarPost(`ПОДБОРКА АВТО ИЗ ЯПОНИИ ДО 160 Л.С.
1) Toyota Harrier 2020 — 2 900 000 ₽
2) Mitsubishi Delica 2019 — 2 500 000 ₽
3) BMW X1 2018 — 2 100 000 ₽`, NOW);
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") expect(r.errors[0]).toMatch(/подборк/i);
  });

  it("rejects an incomplete post instead of inventing data", () => {
    const r = parseCarPost("Toyota Prius из Японии, цена 1 200 000 ₽", NOW);
    expect(r.kind).toBe("invalid");
    if (r.kind === "invalid") expect(r.errors.join()).toMatch(/год/);
  });

  it("rejects posts with two different prices", () => {
    const r = parseCarPost("Honda Fit 2020г. из Японии\\nцена 1 000 000 ₽, со скидкой 950 000 ₽", NOW);
    expect(r.kind).toBe("invalid");
  });

  it("rejects negative and ambiguous ¥ prices", () => {
    expect(parseCarPost("Honda Fit 2020г. Япония цена -100 ₽", NOW).kind).toBe("invalid");
    expect(parseCarPost("Honda Fit 2020г. Япония цена 900 000 ¥ 1 000 000 JPY", NOW).kind).toBe("invalid");
  });

  it("marks sold and supports млн", () => {
    const c = ok("Продан! Honda Vezel 2021г. из Японии, 1,9 млн ₽");
    expect(c).toMatchObject({ status: "sold", price: 1900000, model: "Vezel" });
  });

  it("keeps the strict #авто template working", () => {
    expect(parseCarPost("#авто\\nМарка: Kia\\nМодель: K5\\nГод: 2021\\nСтрана: Корея\\nЦена: 2 000 000 ₽", NOW).kind).toBe("ok");
  });
});
