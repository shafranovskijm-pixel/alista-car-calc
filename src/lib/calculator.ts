// Customs calculation logic for Russian Federation

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

// Approximate exchange rates to RUB
const rates: Record<Currency, number> = {
  RUB: 1,
  EUR: 100,
  USD: 92,
  JPY: 0.62,
};

function toRub(amount: number, currency: Currency): number {
  return amount * rates[currency];
}

// Customs duty for individuals (cars)
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

// Excise tax based on horsepower (2024 rates approximate)
function calcExcise(power: number): number {
  if (power <= 90) return 0;
  if (power <= 150) return power * 55;
  if (power <= 200) return power * 531;
  if (power <= 300) return power * 869;
  if (power <= 400) return power * 1482;
  if (power <= 500) return power * 1534;
  return power * 1584;
}

// Recycling fee (approximate, 2024)
function calcRecyclingFee(vehicleType: VehicleType, engineVolume: number, age: AgeCategory, importerType: ImporterType): number {
  const baseRate = vehicleType === 'car' || vehicleType === 'motorcycle' ? 20000 : 150000;
  let coefficient = 1;

  const isOld = age === '3-5' || age === '5-7' || age === '7+';

  if (vehicleType === 'car') {
    if (engineVolume <= 1000) coefficient = isOld ? 6.15 : 0.17;
    else if (engineVolume <= 2000) coefficient = isOld ? 15.69 : 0.17;
    else if (engineVolume <= 3000) coefficient = isOld ? 24.01 : 0.17;
    else if (engineVolume <= 3500) coefficient = isOld ? 60.06 : 12.56;
    else coefficient = isOld ? 74.25 : 12.56;
  } else if (vehicleType === 'truck') {
    coefficient = isOld ? 24.01 : 0.5;
  } else {
    coefficient = isOld ? 6.15 : 0.17;
  }

  if (importerType === 'individual' && vehicleType === 'car') {
    return baseRate * (isOld ? 0.26 : 0.17);
  }

  return baseRate * coefficient;
}

// Customs processing fee
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
  } else {
    // Legal entity: flat rate based on vehicle type
    const dutyRate = input.vehicleType === 'car' || input.vehicleType === 'motorcycle' ? 0.15 : 0.10;
    customsDuty = Math.max(priceRub * dutyRate, priceRub * 0.05);
  }

  // Excise
  const excise = input.fuelType === 'electric' ? 0 : calcExcise(input.power);

  // VAT (20% on price + duty + excise)
  const vatBase = priceRub + customsDuty + excise;
  const vat = input.importerType === 'individual' ? 0 : vatBase * 0.20;

  // Recycling fee
  const recyclingFee = calcRecyclingFee(input.vehicleType, input.engineVolume, input.age, input.importerType);

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
