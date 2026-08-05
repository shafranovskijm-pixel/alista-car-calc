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

const CleanLight = ({ offer, items, clientName, agent, client }: Props) => {
  const lines = clientLines(client);
  return (
    <div className="offer-a4" style={{ fontFamily: PDF_FONT }}>
      <div data-pdf-page className="bg-white text-[#0F172A] flex flex-col" style={{ width: 794, minHeight: 1123 }}>
        <div data-pdf-flow className="flex-1 px-14 pt-12 pb-4">
          <div
            data-pdf-block
            data-pdf-page-header
            className="flex items-start justify-between gap-8 border-b-2 border-[#2563EB] pb-5"
          >
            <div style={{ minWidth: 0 }}>
              <div className="text-[11px] tracking-[0.34em] text-[#2563EB] uppercase font-semibold">Alista</div>
              <div style={{ fontFamily: HEAD_FONT, lineHeight: 1.15 }} className="text-[30px] font-bold mt-2">
                Коммерческое предложение
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#64748B]">№</div>
              <div style={{ ...num, fontFamily: HEAD_FONT }} className="text-[26px] font-bold text-[#2563EB]">
                {offer.number}
              </div>
              <div style={num} className="text-[12px] text-[#64748B]">
                {new Date(offer.created_at).toLocaleDateString("ru-RU")}
              </div>
              <div style={num} className="text-[12px] text-[#64748B]">
                Действует {offer.valid_days} дн.
              </div>
            </div>
          </div>

          <div data-pdf-block className="mt-8 grid grid-cols-2 gap-6 text-[13px]">
            <div style={{ minWidth: 0 }}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#64748B] mb-1">Клиент</div>
              <div className="text-[15px] font-semibold" style={wrap}>
                {clientName || "—"}
              </div>
              {lines.length > 0 && (
                <div className="mt-2 space-y-1 text-[12px] text-[#64748B]">
                  {lines.map((l) => (
                    <div key={l} style={wrap}>
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[#64748B] mb-1">Исполнитель</div>
              <div className="text-[15px] font-semibold" style={wrap}>
                {agent.name}
              </div>
              <div className="mt-2 space-y-1 text-[12px] text-[#64748B]">
                <div style={wrap}>ИНН {agent.inn}</div>
                <div style={wrap}>{agent.address}</div>
                <div style={wrap}>{agent.phone}</div>
                <div style={wrap}>{agent.email}</div>
              </div>
            </div>
          </div>

          {offer.title && offer.title !== "Коммерческое предложение" && (
            <div data-pdf-block style={wrap} className="mt-8 text-[18px] font-semibold">
              {offer.title}
            </div>
          )}
          {offer.intro && (
            <div
              data-pdf-block
              style={{ ...wrap, whiteSpace: "pre-line", lineHeight: 1.45 }}
              className="mt-3 text-[13px] text-[#475569]"
            >
              {offer.intro}
            </div>
          )}

          <div
            data-pdf-block
            data-pdf-repeat
            className="mt-8 grid bg-[#F1F5F9] border-y border-[#E2E8F0] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#475569]"
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
              className="grid border-b border-[#E2E8F0] px-4 py-4"
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

          <div data-pdf-block className="mt-6 flex justify-end">
            <div className="w-[320px] space-y-2 text-[13px]">
              <div className="flex justify-between text-[#64748B]">
                <span>Подытог</span>
                <span style={num}>{money(offer.subtotal, offer.currency)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>НДС {offer.vat_rate}%</span>
                <span style={num}>{money(offer.vat_amount, offer.currency)}</span>
              </div>
              <div className="h-px bg-[#E2E8F0]" />
              <div className="flex justify-between items-baseline bg-[#2563EB] text-white rounded-md px-4 py-3">
                <span className="text-[11px] uppercase tracking-[0.18em]">Итого</span>
                <span style={num} className="text-[21px] font-bold">{money(offer.total, offer.currency)}</span>
              </div>
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

export default CleanLight;
