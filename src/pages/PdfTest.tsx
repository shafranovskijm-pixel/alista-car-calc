import { useState } from "react";
import OfferPreview from "@/components/admin/offers/OfferPreview";
import { renderOfferPdf, blobToBase64 } from "@/lib/offerPdf";
import type { Offer, OfferItem } from "@/lib/offers";

const mkOffer = (o: Partial<Offer> = {}): Offer =>
  ({
    id: "1", number: "КП-0001", title: "Коммерческое предложение", intro: "",
    template: "premium_dark", currency: "RUB", vat_rate: 22, subtotal: 0, vat_amount: 0, total: 0,
    valid_days: 14, created_at: "2026-08-05T00:00:00Z", status: "draft", ...o,
  } as unknown as Offer);

const mkItems = (n: number, long = false): OfferItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i), offer_id: "1", name: long
      ? `Растаможка автомобиля физлицо с полным комплексом сопроводительных услуг №${i + 1}`
      : "Растаможка автомобиля физлицо",
    description: long
      ? "Полное таможенное оформление автомобиля для физического лица, включая подготовку документов, расчёт платежей, взаимодействие с таможенным постом и получение ЭПТС в установленные сроки."
      : "Полное таможенное оформление автомобиля для физического лица",
    qty: 1, unit: "шт", price: long ? 1234567 : 0, sort: i,
  })) as unknown as OfferItem[];

const CASES: Record<string, { offer: Offer; items: OfferItem[]; clientName: string; client: any }> = {
  case1: { offer: mkOffer(), items: mkItems(1), clientName: "Клиент", client: null },
  case2: {
    offer: mkOffer({ subtotal: 6172835, vat_amount: 1358023, total: 7530858, intro: "Предлагаем комплексное таможенное оформление и доставку." }),
    items: mkItems(5, true),
    clientName: "Общество с ограниченной ответственностью «Дальневосточная транспортно-логистическая компания Владивосток-Транзит»",
    client: { name: "x", contact: "Шафрановский Михаил Александрович", phone: "+7 914 073-01-96, +7 423 000-00-00", email: "very.long.email.address.for.testing@dalnevostochnaya-logistika.example.com", inn: "2543194698", kpp: "254301001", address: "690091, Приморский край, г. Владивосток, ул. Адмирала Фокина, д. 25, офис 412, бизнес-центр «Приморье»" },
  },
  case3: { offer: mkOffer({ subtotal: 14814804, vat_amount: 3259257, total: 18074061 }), items: mkItems(12, true), clientName: "ООО «Тест»", client: { name: "x", inn: "2543194698", address: "г. Владивосток" } },
  case4: { offer: mkOffer(), items: mkItems(2), clientName: "Иванов Иван Иванович", client: { name: "x" } },
};

const PdfTest = () => {
  const [caseKey, setCaseKey] = useState("case1");
  const [tpl, setTpl] = useState("premium_dark");
  const c = CASES[caseKey];
  const offer = { ...c.offer, template: tpl } as Offer;
  const run = async () => {
    const node = document.querySelector<HTMLElement>(".offer-a4")!;
    const blob = await renderOfferPdf(node);
    (window as any).__pdf = await blobToBase64(blob);
  };
  return (
    <div>
      <select data-testid="case" value={caseKey} onChange={(e) => setCaseKey(e.target.value)}>
        {Object.keys(CASES).map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
      <select data-testid="tpl" value={tpl} onChange={(e) => setTpl(e.target.value)}>
        {["premium_dark", "clean_light", "executive"].map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
      <button data-testid="gen" onClick={run}>gen</button>
      <div id="prev"><OfferPreview offer={offer} items={c.items} clientName={c.clientName} client={c.client} /></div>
    </div>
  );
};
export default PdfTest;
