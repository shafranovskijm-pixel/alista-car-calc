// Customs calculation logic for Russian Federation
// Updated to 2025–2026 regulations

export type VehicleType = 'car' | 'truck' | 'motorcycle' | 'bus' | 'trailer' | 'atv' | 'snowmobile' | 'watercraft';
export type ImporterType = 'individual' | 'legal';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';
export type AgeCategory = 'new' | '1-3' | '3-5' | '5-7' | '7+';
export type Currency = 'EUR' | 'USD' | 'JPY' | 'RUB';

export interface CalcInput {
  vehicleType: VehicleType;
  price: number;
  currency: Currency;
  engineVolume: number; // cm³
  power: number; // hp
  fuelType: FuelType;
  age: AgeCategory;
  importerType: ImporterType;
  mass: number; // kg
}

export interface CalcResult {
  customsDuty: number;
  excise: number;
  vat: number;
  recyclingFee: number;
  customsFee: number;
  total: number;
}

// Default fallback exchange rates to RUB
export const DEFAULT_RATES: Record<Currency, number> = {
  RUB: 1,
  EUR: 95,
  USD: 87,
  JPY: 0.58,
};

export const RATES_DATE = '24.03.2026';

function toRub(amount: number, currency: Currency, rates: Record<Currency, number>): number {
  return amount * rates[currency];
}

// Customs duty for individuals (cars) — ЕТТ ЕАЭС
function individualCarDuty(priceEur: number, engineVolume: number, age: AgeCategory): number {
  if (age === 'new' || age === '1-3') {
    // Cars up to 3 years
    if (priceEur <= 8500) return Math.max(priceEur * 0.54, engineVolume * 2.5);
    if (priceEur <= 16700) return Math.max(priceEur * 0.48, engineVolume * 3.5);
    if (priceEur <= 42300) return Math.max(priceEur * 0.48, engineVolume * 5.5);
    if (priceEur <= 84500) return Math.max(priceEur * 0.48, engineVolume * 7.5);
    if (priceEur <= 169000) return Math.max(priceEur * 0.48, engineVolume * 15);
    return Math.max(priceEur * 0.48, engineVolume * 20);
  }

  if (age === '3-5') {
    if (engineVolume <= 1000) return engineVolume * 1.5;
    if (engineVolume <= 1500) return engineVolume * 1.7;
    if (engineVolume <= 1800) return engineVolume * 2.5;
    if (engineVolume <= 2300) return engineVolume * 2.7;
    if (engineVolume <= 3000) return engineVolume * 3.0;
    return engineVolume * 3.6;
  }

  // 5-7 and 7+
  if (engineVolume <= 1000) return engineVolume * 3.0;
  if (engineVolume <= 1500) return engineVolume * 3.2;
  if (engineVolume <= 1800) return engineVolume * 3.5;
  if (engineVolume <= 2300) return engineVolume * 4.8;
  if (engineVolume <= 3000) return engineVolume * 5.0;
  return engineVolume * 5.7;
}

// Customs duty for legal entities — differentiated by age & engine volume
// Based on ЕТТ ЕАЭС, codes 8703
function legalEntityCarDuty(priceRub: number, priceEur: number, engineVolume: number, age: AgeCategory, vehicleType: VehicleType, eurRate: number): number {
  if (vehicleType !== 'car' && vehicleType !== 'motorcycle') {
    // Trucks, buses, trailers etc. — 10–15% but min 0.5–1.0 €/cm³
    const dutyRate = vehicleType === 'truck' || vehicleType === 'bus' ? 0.15 : 0.10;
    return Math.max(priceRub * dutyRate, engineVolume * 0.5 * rates.EUR);
  }

  if (age === 'new' || age === '1-3') {
    // New cars for legal entities: 15% but not less than specific €/cm³
    if (engineVolume <= 1000) return Math.max(priceRub * 0.15, engineVolume * 0.36 * rates.EUR);
    if (engineVolume <= 1500) return Math.max(priceRub * 0.15, engineVolume * 0.4 * rates.EUR);
    if (engineVolume <= 1800) return Math.max(priceRub * 0.15, engineVolume * 0.36 * rates.EUR);
    if (engineVolume <= 2300) return Math.max(priceRub * 0.15, engineVolume * 0.44 * rates.EUR);
    if (engineVolume <= 3000) return Math.max(priceRub * 0.15, engineVolume * 0.44 * rates.EUR);
    return Math.max(priceRub * 0.15, engineVolume * 0.8 * rates.EUR);
  }

  if (age === '3-5') {
    // 3-5 years: 20% but not less than specific €/cm³
    if (engineVolume <= 1000) return Math.max(priceRub * 0.20, engineVolume * 0.36 * rates.EUR);
    if (engineVolume <= 1500) return Math.max(priceRub * 0.20, engineVolume * 0.4 * rates.EUR);
    if (engineVolume <= 1800) return Math.max(priceRub * 0.20, engineVolume * 0.36 * rates.EUR);
    if (engineVolume <= 2300) return Math.max(priceRub * 0.20, engineVolume * 0.44 * rates.EUR);
    if (engineVolume <= 3000) return Math.max(priceRub * 0.20, engineVolume * 0.44 * rates.EUR);
    return Math.max(priceRub * 0.20, engineVolume * 0.8 * rates.EUR);
  }

  // 5-7 and 7+ years — higher specific rates
  if (engineVolume <= 1000) return engineVolume * 1.4 * rates.EUR;
  if (engineVolume <= 1500) return engineVolume * 1.5 * rates.EUR;
  if (engineVolume <= 1800) return engineVolume * 1.6 * rates.EUR;
  if (engineVolume <= 2300) return engineVolume * 2.2 * rates.EUR;
  if (engineVolume <= 3000) return engineVolume * 2.2 * rates.EUR;
  return engineVolume * 3.2 * rates.EUR;
}

// Excise tax based on horsepower (2026 rates, ФЗ № 425-ФЗ)
function calcExcise(power: number): number {
  if (power <= 90) return 0;
  if (power <= 150) return power * 64;
  if (power <= 200) return power * 613;
  if (power <= 300) return power * 1004;
  if (power <= 400) return power * 1564;
  if (power <= 500) return power * 1621;
  return power * 1678;
}

// Recycling fee (Постановление 1291 в ред. 1713, с 01.12.2025)
// Base rates: cars/motorcycles = 20 000 ₽, trucks = 150 000 ₽
function calcRecyclingFee(
  vehicleType: VehicleType,
  engineVolume: number,
  power: number,
  age: AgeCategory,
  importerType: ImporterType,
  fuelType: FuelType
): number {
  const isNew = age === 'new' || age === '1-3' || age === '3-5';
  const isOld = !isNew; // 5-7 and 7+

  // Electric vehicles
  if (fuelType === 'electric') {
    const baseRate = 20000;
    // Power in kW (approximate: 1 hp ≈ 0.7355 kW)
    const powerKw = power * 0.7355;
    if (powerKw <= 90) return baseRate * (isNew ? 2.41 : 8.26);
    if (powerKw <= 150) return baseRate * (isNew ? 8.86 : 24.38);
    if (powerKw <= 200) return baseRate * (isNew ? 12.56 : 33.95);
    return baseRate * (isNew ? 22.25 : 55.02);
  }

  if (vehicleType === 'car' || vehicleType === 'motorcycle') {
    const baseRate = 20000;

    // Coefficients per Decree 1291 ed. 1713 (from 01.12.2025)
    // For cars with ICE/hybrid, by engine volume
    if (engineVolume <= 1000) return baseRate * (isNew ? 4.06 : 10.36);
    if (engineVolume <= 1500) return baseRate * (isNew ? 15.69 : 24.38);
    if (engineVolume <= 2000) return baseRate * (isNew ? 33.37 : 47.15);
    if (engineVolume <= 2500) return baseRate * (isNew ? 37.41 : 60.06);
    if (engineVolume <= 3000) return baseRate * (isNew ? 42.24 : 74.25);
    if (engineVolume <= 3500) return baseRate * (isNew ? 60.06 : 81.89);
    return baseRate * (isNew ? 74.25 : 105.58);
  }

  if (vehicleType === 'truck' || vehicleType === 'bus') {
    const baseRate = 150000;
    // Simplified truck/bus coefficients by mass category
    if (engineVolume <= 2500) return baseRate * (isNew ? 1.44 : 4.56);
    if (engineVolume <= 5000) return baseRate * (isNew ? 2.21 : 6.91);
    if (engineVolume <= 8000) return baseRate * (isNew ? 4.56 : 14.0);
    return baseRate * (isNew ? 8.39 : 24.01);
  }

  // ATV, snowmobile, watercraft, trailer
  const baseRate = vehicleType === 'trailer' ? 150000 : 20000;
  return baseRate * (isNew ? 0.5 : 1.52);
}

// Customs processing fee (Постановление 1637, с 01.01.2025)
function calcCustomsFee(valueRub: number): number {
  if (valueRub <= 200000) return 775;
  if (valueRub <= 450000) return 1550;
  if (valueRub <= 1200000) return 3100;
  if (valueRub <= 2700000) return 8530;
  if (valueRub <= 4200000) return 12000;
  if (valueRub <= 5500000) return 15500;
  if (valueRub <= 7000000) return 20000;
  if (valueRub <= 8000000) return 23000;
  if (valueRub <= 9000000) return 25000;
  if (valueRub <= 10000000) return 27000;
  return 30000;
}

export function calculate(input: CalcInput): CalcResult {
  const priceRub = toRub(input.price, input.currency);
  const priceEur = priceRub / rates.EUR;

  let customsDuty: number;

  if (input.importerType === 'individual' && (input.vehicleType === 'car' || input.vehicleType === 'motorcycle')) {
    // Individual duty in EUR, convert to RUB
    customsDuty = individualCarDuty(priceEur, input.engineVolume, input.age) * rates.EUR;
  } else if (input.importerType === 'legal') {
    customsDuty = legalEntityCarDuty(priceRub, priceEur, input.engineVolume, input.age, input.vehicleType);
  } else {
    // Individual importing non-car (truck, bus, etc.) — simplified
    const dutyRate = 0.15;
    customsDuty = Math.max(priceRub * dutyRate, priceRub * 0.05);
  }

  // Excise (only for legal entities; individuals importing for personal use are exempt)
  const excise = (input.fuelType === 'electric' || input.importerType === 'individual') ? 0 : calcExcise(input.power);

  // VAT 22% (с 01.01.2026, ФЗ № 425-ФЗ)
  const vatBase = priceRub + customsDuty + excise;
  const vat = input.importerType === 'individual' ? 0 : vatBase * 0.22;

  // Recycling fee (Постановление 1291 ред. 1713)
  const recyclingFee = calcRecyclingFee(input.vehicleType, input.engineVolume, input.power, input.age, input.importerType, input.fuelType);

  // Customs processing fee
  const customsFee = calcCustomsFee(priceRub);

  const total = customsDuty + excise + vat + recyclingFee + customsFee;

  return {
    customsDuty: Math.round(customsDuty),
    excise: Math.round(excise),
    vat: Math.round(vat),
    recyclingFee: Math.round(recyclingFee),
    customsFee: Math.round(customsFee),
    total: Math.round(total),
  };
}

export const vehicleTypeLabels: Record<VehicleType, string> = {
  car: 'Легковой автомобиль',
  truck: 'Грузовик',
  motorcycle: 'Мотоцикл',
  bus: 'Автобус',
  trailer: 'Прицеп',
  atv: 'Квадроцикл',
  snowmobile: 'Снегоход',
  watercraft: 'Водный транспорт',
};

export const fuelTypeLabels: Record<FuelType, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  electric: 'Электро',
  hybrid: 'Гибрид',
};

export const ageCategoryLabels: Record<AgeCategory, string> = {
  new: 'Новый (до 1 года)',
  '1-3': 'От 1 до 3 лет',
  '3-5': 'От 3 до 5 лет',
  '5-7': 'От 5 до 7 лет',
  '7+': 'Более 7 лет',
};

export const currencyLabels: Record<Currency, string> = {
  EUR: '€ Евро',
  USD: '$ Доллар',
  JPY: '¥ Йена',
  RUB: '₽ Рубль',
};
