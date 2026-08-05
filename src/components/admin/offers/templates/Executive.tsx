import { Offer, OfferItem, money } from "@/lib/offers";
import type { OfferClient } from "../OfferPreview";
import { HEAD_FONT, PDF_FONT, ROW_GRID, clientLines, num, wrap } from "./parts";

type Props = {
  offer: Offer;
  items: OfferItem[];
  clientName: string;
  agent: { name: string; inn: string; address: string; phone: string; email: string };
  client?: OfferClient;
};

const Executive = ({ offer, items, clientName, agent, client }: Props) => {
  const lines = clientLines(client);
  return (
    <div className="offer-a4" style={{ fontFamily: PDF_FONT }}>
      {/* Cover — always exactly one A4 page */}
      <div
        data-pdf-page
        className="text-white relative"
        style={{
          width: 794,
          height: 1123,
          maxHeight: 1123,
          overflow: "hidden",
          background: "linear-gradient(135deg, #081426 0%, #123B70 60%, #0369A1 100%)",
        }}
      >
        <div className="h-full flex flex-col px-16 py-16">
          <div className="text-[12px] tracking-[0.42em] text-[#7FB0FF] uppercase font-semibold">Alista · Executive</div>

          <div className="mt-auto mb-auto" style={{ minWidth: 0 }}>
            <div className="text-[13px] uppercase tracking-[0.2em] text-[#9DB6D8]">Коммерческое предложение</div>
            <div style={{ fontFamily: HEAD_FONT, ...num, lineHeight: 1.05 }} className="text-[88px] font-bold mt-5">
              {offer.number}
            </div>
            {offer.title && offer.title !== "Коммерческое предложение" && (
              <div style={wrap} className="mt-8 text-[22px] font-semibold text-[#E2E8F0] max-w-[560px]">
                {offer.title}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 border-t border-white/15 pt-6 text-[12px]">
            <div style={{ minWidth: 0 }}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#9DB6D8]">Подготовлено для</div>
              <div style={wrap} className="text-[17px] font-semibold text-white mt-1">
                {clientName || "—"}
              </div>
              {lines.length > 0 && (
                <div className="mt-2 space-y-1 text-[12px] text-[#C7D6EA]">
                  {lines.map((l) => (
                    <div key={l} style={wrap}>{l}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right" style={{ minWidth: 0 }}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#9DB6D8]">Дата · Действует</div>
              <div style={num} className="text-[15px] font-semibold text-white mt-1">
                {new Date(offer.created_at).toLocaleDateString("ru-RU")} · {offer.valid_days} дн.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div data-pdf-page className="bg-white text-[#0F172A] flex flex-col" style={{ width: 794, minHeight: 1123 }}>
        <div data-pdf-flow className="flex-1 px-14 pt-12 pb-4">
          <div data-pdf-block className="flex justify-between items-center gap-6 border-b border-[#E2E8F0] pb-4">
            <div className="text-[11px] tracking-[0.32em] text-[#2563EB] uppercase font-semibold">
              Смета · {offer.number}
            </div>
            <div className="text-[12px] text-[#64748B]" style={wrap}>{agent.name}</div>
          </div>

          {offer.intro && (
            <div
              data-pdf-block
              style={{ ...wrap, whiteSpace: "pre-line", lineHeight: 1.45 }}
              className="mt-6 text-[13px] text-[#334155]"
            >
              {offer.intro}
            </div>
          )}

          <div
            data-pdf-block
            data-pdf-repeat
            className="mt-6 grid border-b-2 border-[#0F172A] pb-3 pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0F172A]"
            style={{ gridTemplateColumns: ROW_GRID }}
          >
            <div style={wrap}>Услуга</div>
            <div className="text-center" style={num}>Кол-во</div>
            <div className="text-right" style={num}>Цена</div>
            <div className="text-right" style={num}>Сумма</div>
          </div>

          {items.map((it) => (
            <div
              key={it.id}
              data-pdf-block
              className="grid border-b border-[#E2E8F0] py-4"
              style={{ gridTemplateColumns: ROW_GRID, alignItems: "flex-start" }}
            >
              <div style={{ minWidth: 0, paddingRight: 16 }}>
                <div className="text-[13px] font-semibold" style={wrap}>{it.name}</div>
                {it.description && (
                  <div className="mt-1.5 text-[12px] text-[#64748B]" style={{ ...wrap, lineHeight: 1.45 }}>
                    {it.description}
                  </div>
                )}
              </div>
              <div className="text-center text-[12px] text-[#475569]" style={num}>{it.qty} {it.unit}</div>
              <div className="text-right text-[12px] text-[#475569]" style={num}>{money(it.price, offer.currency)}</div>
              <div className="text-right text-[13px] font-semibold" style={num}>
                {money(Number(it.qty) * Number(it.price), offer.currency)}
              </div>
            </div>
          ))}

          <div data-pdf-block className="mt-8 flex justify-end">
            <div className="w-[340px]">
              <div className="flex justify-between text-[13px] text-[#64748B] py-2">
                <span>Подытог</span>
                <span style={num}>{money(offer.subtotal, offer.currency)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-[#64748B] py-2 border-b border-[#E2E8F0]">
                <span>НДС {offer.vat_rate}%</span>
                <span style={num}>{money(offer.vat_amount, offer.currency)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-4">
                <span className="text-[12px] uppercase tracking-[0.18em] text-[#64748B]">К оплате</span>
                <span style={{ ...num, fontFamily: HEAD_FONT }} className="text-[28px] font-bold text-[#2563EB]">
                  {money(offer.total, offer.currency)}
                </span>
              </div>
            </div>
          </div>

          <div data-pdf-block className="mt-10 grid grid-cols-3 gap-6 text-[12px] border-t border-[#E2E8F0] pt-6">
            <div style={{ minWidth: 0 }}>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#64748B] mb-2">Сроки</div>
              <div style={wrap}>Начало работ — в течение 3 рабочих дней после подписания договора.</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#64748B] mb-2">Оплата</div>
              <div style={wrap}>50% предоплата, 50% по факту выполнения этапа.</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="text-[11px] uppercase tracking-[0.16em] text-[#64748B] mb-2">Гарантии</div>
              <div style={wrap}>Полное сопровождение сделки и возврат средств при невозможности исполнения.</div>
            </div>
          </div>

          <div
            data-pdf-block
            className="mt-10 pt-5 border-t border-[#E2E8F0] text-[11px] text-[#64748B] grid grid-cols-2 gap-6"
          >
            <div style={{ minWidth: 0 }}>
              <div className="text-[12px] font-semibold text-[#0F172A] mb-1" style={wrap}>{agent.name}</div>
              <div style={wrap}>ИНН {agent.inn}</div>
              <div style={wrap}>{agent.address}</div>
            </div>
            <div className="text-right" style={{ minWidth: 0 }}>
              <div style={{ ...wrap, textAlign: "right" }}>{agent.phone}</div>
              <div style={{ ...wrap, textAlign: "right" }}>{agent.email}</div>
              <div className="mt-1 font-semibold text-[#2563EB]">alistaru.ru</div>
            </div>
          </div>
        </div>

        <div className="px-14 pb-6 pt-2 flex justify-between text-[10px] text-[#94A3B8]">
          <span>{offer.number} · alistaru.ru</span>
          <span data-pdf-pageno style={{ ...num, display: "none" }} />
        </div>
      </div>
    </div>
  );
};

export default Executive;
