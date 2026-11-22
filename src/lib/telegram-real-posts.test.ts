import { describe, expect, it } from "vitest";
import { parseCarPost } from "../../supabase/functions/_shared/telegram-parse";

const NOW = new Date("2026-11-22T00:00:00Z");
const FOOTER = `\n🌏 ALISTA — авто из Японии, Китая и Кореи под ключ: подбор, покупка, доставка и растаможка.\n📞 +7 914 073-01-96\n✈️ t.me/alistaavto25\n🌐 alistaru.ru`;
const ok = (text: string) => {
  const result = parseCarPost(text, NOW);
  if (result.kind !== "ok") throw new Error(JSON.stringify(result));
  return result.car;
};

describe("real @alistaavto25 posts", () => {
  it("/445 imports Subaru with one country despite the advertising footer", () => {
    const source = `Доступен к заказу из Японии
🇯🇵 SUBARU FORESTER ADVANCE e-BOXER
🚗 Автомобиль - 12.2022г. ПРАВЫЙ руль
🏃‍♂️ Пробег - 9 049 км
🎬 Мотор 2.0 гибрид e-BOXER, 145 л.с., полный привод AWD, вариатор
💪 Тип двигателя - Гибрид (бензин + электро)
💰 А цена данного автомобиля ОТ
✅ 2 480 000 ₽ под ключ во Владивостоке${FOOTER}`;
    const car = ok(source);
    expect(car).toMatchObject({ brand: "Subaru", model: "FORESTER ADVANCE e-BOXER", title: "SUBARU FORESTER ADVANCE e-BOXER", year: 2022, country: "japan", price: 2480000, mileage_km: 9049, engine_volume: 2, power_hp: 145, transmission: "cvt", fuel: "hybrid" });
    expect(car.description).toBe(source);
  });

  it("/448 imports Toyota RAV4 and keeps its complete trim", () => {
    const car = ok(`Доступен к заказу из Японии
🇯🇵 TOYOTA RAV4 G 4WD
🚗 Автомобиль - 07.2023г. ПРАВЫЙ руль
🏃‍♂️ Пробег - 25 393 км
🎬 Мотор 2.0 бензин 4WD 171 л.с., вариатор Direct Shift CVT
✅ 3 840 000 ₽ под ключ во Владивостоке${FOOTER}`);
    expect(car).toMatchObject({ brand: "Toyota", model: "RAV4 G 4WD", title: "TOYOTA RAV4 G 4WD", year: 2023, country: "japan", price: 3840000, mileage_km: 25393, power_hp: 171, fuel: "petrol", transmission: "cvt" });
  });

  it("/455 uses the Chinese import fact, not the German manufacturer flag", () => {
    const car = ok(`Доступен к заказу из Китая 🚛
🇨🇳 🇩🇪 BMW 3 Series 325Li M Sport
🚗 Автомобиль - 07.2022г. ЛЕВЫЙ руль
🏃‍♂️ Пробег - 79 000 км
🎬 Мотор 2.0 турбо бензин 184 л.с., задний привод, автомат
💰 А цена данного автомобиля под ключ с растаможкой и утилём
✅ ОТ 3 796 194 ₽${FOOTER}`);
    expect(car).toMatchObject({ brand: "BMW", model: "3 Series 325Li M Sport", title: "BMW 3 Series 325Li M Sport", year: 2022, country: "china", price: 3796194, mileage_km: 79000, transmission: "at" });
  });

  it("/374 imports only the clear ИТОГО from an itemised price", () => {
    const car = ok(`🚗 Toyota Yaris L X, 2022 год
📍 Пробег: 26 723 км
⚙️ Двигатель: 7NR, 1.5 л (1496 см³), бензин
💰 Стоимость под ключ во Владивостоке:
🇨🇳 Автомобиль в Китае: 1 010 000 ₽
🛃 Растаможка: 230 000 ₽
🚛 Комиссии и автовоз: 100 000 ₽
✅ ИТОГО: 1 340 000 ₽`);
    expect(car).toMatchObject({ brand: "Toyota", model: "Yaris L X", year: 2022, country: "china", price: 1340000, mileage_km: 26723, engine_volume: 1.5 });
  });

  it("uses one explicit под ключ total in a breakdown without ИТОГО", () => {
    const car = ok(`Honda Fit 2020г.
Автомобиль в Японии: 800 000 ₽
Растаможка: 300 000 ₽
Цена под ключ: 1 200 000 ₽`);
    expect(car).toMatchObject({ brand: "Honda", model: "Fit", country: "japan", price: 1200000 });
  });

  it("/415 reads the standalone calendar year and does not turn 149,6 hp into 6 hp", () => {
    const car = ok(`🚗 В НАЛИЧИИ ВО ВЛАДИВОСТОКЕ BMW 218d
📅 06.2022 ·
🇰🇷 из Кореи
⛽ Дизель 2.0 (1 995 см³), 149,6 л.с.
💰 2 720 000 ₽ под ключ (растаможен, во Владивостоке)`);
    expect(car).toMatchObject({ brand: "BMW", model: "218d", title: "BMW 218d", year: 2022, country: "korea", price: 2720000, engine_volume: 2, power_hp: null, status: "in_stock" });
  });

  it.each([
    ["/463", `🇯🇵 SUBARU FORESTER e-BOXER
Гибридный Forester из Японии с полным приводом
🚗 Автомобиль - 07.2022г. ПРАВЫЙ руль
🏃‍♂️ Пробег - 24 793 км
🎬 Мотор 2.0 гибрид e-BOXER (1 995 см³), полный привод AWD, вариатор`, "SUBARU FORESTER e-BOXER", "Subaru", 2022, 24793],
    ["/472", `🇯🇵 TOYOTA NOAH 4WD
Семейный минивэн из Японии с полным приводом
🚗 Автомобиль - 06.2021г. ПРАВЫЙ руль
🏃‍♂️ Пробег - 104 693 км
🎬 Мотор 2.0 бензин (1 986 см³), полный привод 4WD, вариатор`, "TOYOTA NOAH 4WD", "Toyota", 2021, 104693],
    ["/482", `🇩🇪 VOLKSWAGEN TIGUAN R-Line
Рестайлинговый Tiguan из Японии в спортивной версии R-Line
🚗 Автомобиль - 04.2021г. ПРАВЫЙ руль
🏃‍♂️ Пробег - 56 796 км
🎬 Мотор 1.5 TSI турбо бензин (1 497 см³), 150 л.с., передний привод, робот DSG`, "VOLKSWAGEN TIGUAN R-Line", "Volkswagen", 2021, 56796],
  ])("%s allows a missing price without inventing zero", (_id, body, title, brand, year, mileage) => {
    const source = `${body}${FOOTER}`;
    const car = ok(source);
    expect(car).toMatchObject({ brand, title, year, country: "japan", price: null, currency: "RUB", mileage_km: mileage });
    expect(car.description).toBe(source);
  });

  it.each([
    ["/383", `🚙 NISSAN JUKE 2015 — уже во Владивостоке!
Компактный кроссовер из Японии
▪️ Год выпуска: 06.2015
▪️ Двигатель: 1.5 л (1 498 см³), HR15, бензин
▪️ Мощность: 114 л.с.
▪️ Коробка: вариатор (CVT)
▪️ Пробег: 88 398 км
💰 Цена во Владивостоке: 1 250 000 ₽`, "NISSAN JUKE 2015", 1250000],
    ["/425", `BMW X1 — свежий кроссовер из Китая!
▪️ Модель: BMW X1 sDrive20Li
▪️ Год: 10.2023
▪️ Растаможен: 11.11.2026
▪️ Пробег: 33 332 км
💰 Цена: 2 959 000 ₽ под ключ`, "BMW X1", 2959000],
    ["/434", `Доступен к заказу из Японии
🇯🇵 HONDA N-BOX CUSTOM 4WD
🚗 Автомобиль - 2026г. ПРАВЫЙ руль
🏃‍♂️ Пробег - 4 км
🎬 Мотор 0.66 бензин 4WD 58 л.с, вариатор
✅ 1 230 000 ₽`, "HONDA N-BOX CUSTOM 4WD", 1230000],
    ["/439", `Доступен к заказу из Японии
🇯🇵 HONDA N-BOX
🚗 Автомобиль - 2026г. ПРАВЫЙ руль
🏃‍♂️ Пробег - 2 км
🎬 Мотор 0.66 бензин 2wd 58 л.с, вариатор
✅ 1 035 000 ₽ под ключ во Владивостоке`, "HONDA N-BOX", 1035000],
  ])("%s ignores footer facts but keeps vehicle facts", (_id, body, title, price) => {
    const car = ok(`${body}${FOOTER}`);
    expect(car.title).toBe(title);
    expect(car.price).toBe(price);
    expect(car.country).toBe(body.includes("Китая") ? "china" : "japan");
  });

  it("/425 does not confuse the customs date with the production year", () => {
    const car = ok(`BMW X1 — свежий кроссовер из Китая!
▪️ Год: 10.2023
▪️ Растаможен: 11.11.2026
💰 Цена: 2 959 000 ₽`);
    expect(car.year).toBe(2023);
  });

  it("/391 keeps [указать] fields as errors", () => {
    const result = parseCarPost(`KIA K3 — свежий седан из Китая!
▪️ Модель: Kia K3
▪️ Год: [указать]
▪️ Пробег: 16 537 км
💰 Цена: [указать] ₽${FOOTER}`, NOW);
    expect(result.kind).toBe("invalid");
    if (result.kind === "invalid") expect(result.errors.join(" ")).toMatch(/год.*\[указать\]/i);
  });

  it("/365 does not guess a country from a Hyundai", () => {
    const result = parseCarPost(`🚘 HYUNDAI ELANTRA 2022
📅 Производство: 05.2022
🛣 Пробег: 55 052 км
💰 Цена: от 1 550 000 ₽ под ключ во Владивостоке`, NOW);
    expect(result.kind).toBe("invalid");
    if (result.kind === "invalid") expect(result.errors).toContain("Не указана страна (Япония/Корея/Китай)");
  });
});

describe("free-form ambiguity remains protected", () => {
  it("rejects two equally significant prices without a total", () => {
    expect(parseCarPost("Honda Fit 2020г. из Японии\nЦена: 1 000 000 ₽\nСкидка: 950 000 ₽", NOW).kind).toBe("invalid");
  });

  it("rejects a real contradiction between import countries", () => {
    expect(parseCarPost("Honda Fit 2020г. из Японии\nСтрана: Корея\nЦена: 1 000 000 ₽", NOW).kind).toBe("invalid");
  });

  it("rejects a price without a currency and a negative price", () => {
    expect(parseCarPost("Honda Fit 2020г. из Японии\nЦена: 1000000", NOW).kind).toBe("invalid");
    expect(parseCarPost("Honda Fit 2020г. из Японии\nЦена: -100 ₽", NOW).kind).toBe("invalid");
  });

  it("accepts explicit CNY next to ¥ without treating it as JPY", () => {
    const car = ok("BYD Han 2023г. из Китая\nЦена: ¥ 150000 CNY");
    expect(car).toMatchObject({ price: 150000, currency: "CNY" });
  });

  it("still rejects a collection instead of taking its first car", () => {
    const result = parseCarPost(`ПОДБОРКА АВТО ИЗ ЯПОНИИ ДО 160 Л.С.
1) Toyota Harrier 2020 — 2 900 000 ₽
2) Mitsubishi Delica 2019 — 2 500 000 ₽
3) BMW X1 2018 — 2 100 000 ₽${FOOTER}`, NOW);
    expect(result.kind).toBe("invalid");
    if (result.kind === "invalid") expect(result.errors[0]).toMatch(/подборк/i);
  });
});
