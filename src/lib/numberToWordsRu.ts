// Простая конвертация целого числа рублей в текст прописью (русский).
// Поддерживает значения до 999 999 999 999.

const ones = [
  "", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять",
  "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать",
  "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать",
];
const onesF = [
  "", "одна", "две", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять",
  "десять", "одиннадцать", "двенадцать", "тринадцать", "четырнадцать",
  "пятнадцать", "шестнадцать", "семнадцать", "восемнадцать", "девятнадцать",
];
const tens = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"];
const hundreds = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"];

function tripletToWords(num: number, feminine = false): string {
  const parts: string[] = [];
  const h = Math.floor(num / 100);
  const t = Math.floor((num % 100) / 10);
  const u = num % 10;
  if (h) parts.push(hundreds[h]);
  if (t < 2) {
    const n = t * 10 + u;
    if (n) parts.push(feminine ? onesF[n] : ones[n]);
  } else {
    parts.push(tens[t]);
    if (u) parts.push(feminine ? onesF[u] : ones[u]);
  }
  return parts.join(" ");
}

function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function numberToWordsRu(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return "ноль рублей 00 копеек";

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const units = n % 1000;

  const parts: string[] = [];
  if (billions) parts.push(`${tripletToWords(billions)} ${plural(billions, ["миллиард", "миллиарда", "миллиардов"])}`);
  if (millions) parts.push(`${tripletToWords(millions)} ${plural(millions, ["миллион", "миллиона", "миллионов"])}`);
  if (thousands) parts.push(`${tripletToWords(thousands, true)} ${plural(thousands, ["тысяча", "тысячи", "тысяч"])}`);
  if (units) parts.push(tripletToWords(units));

  const wordsRub = parts.join(" ").replace(/\s+/g, " ").trim();
  const cap = wordsRub.charAt(0).toUpperCase() + wordsRub.slice(1);
  const kop = Math.round((Math.abs(value) - n) * 100);
  const kopStr = String(kop).padStart(2, "0");
  return `${cap} ${plural(n, ["рубль", "рубля", "рублей"])} ${kopStr} копеек`;
}