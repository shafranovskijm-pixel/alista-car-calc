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

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-[#E2E8F0] bg-white p-5" style={{ minWidth: 0 }}>
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563EB] mb-2">{title}</div>
    {children}
  </div>
);

const PremiumDark = ({ offer, items, clientName, agent, client }: Props) => {
  const lines = clientLines(client);
  return (
    <div className="offer-a4" style={{ fontFamily: PDF_FONT }}>
      <div
        data-pdf-page
        className="bg-[#F8FAFC] text-[#0F172A] flex flex-col"
        style={{ width: 794, minHeight: 1123 }}
      >
        {/* Brand band — page 1 */}
        <div
          data-pdf-page-header
          className="px-14 py-10 text-white"
          style={{ background: "linear-gradient(135deg, #081426 0%, #123B70 100%)" }}
        >
          <div className="flex items-start justify-between gap-8">
            <div style={{ minWidth: 0 }}>
              <div className="text-[13px] font-semibold tracking-[0.32em] uppercase text-[#7FB0FF]">Alista</div>
              <div className="text-[11px] tracking-[0.24em] uppercase text-[#9DB6D8] mt-1">Владивосток</div>
              <div
                style={{ fontFamily: HEAD_FONT, lineHeight: 1.12 }}
                className="mt-6 text-[36px] font-bold"
              >
                Коммерческое
                <br />
                предложение
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#9DB6D8]">Номер</div>
              <div style={{ ...num, fontFamily: HEAD_FONT }} className="text-[30px] font-bold text-white">
                {offer.number}
              </div>
              <div style={num} className="mt-4 text-[12px] text-[#C7D6EA]">
                {new Date(offer.created_at).toLocaleDateString("ru-RU")}
              </div>
              <div style={num} className="text-[12px] text-[#C7D6EA]">
                Действует {offer.valid_days} дн.
              </div>
            </div>
          </div>
        </div>

        {/* Compact band — continuation pages */}
        <div
          data-pdf-compact-header
          style={{ display: "none", background: "linear-gradient(135deg, #081426 0%, #123B70 100%)" }}
          className="px-14 py-5 text-white flex items-center justify-between"
        >
          <div className="text-[12px] font-semibold tracking-[0.3em] uppercase text-[#7FB0FF]">Alista</div>
          <div style={num} className="text-[12px] text-[#C7D6EA]">
            КП {offer.number}
          </div>
        </div>

        {/* Flow */}
        <div data-pdf-flow className="flex-1 px-14 pt-8 pb-4">
          <div data-pdf-block className="grid grid-cols-2 gap-5" style={{ alignItems: "stretch" }}>
            <Card title="Клиент">
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
            </Card>
            <Card title="Исполнитель">
              <div className="text-[15px] font-semibold" style={wrap}>
                {agent.name}
              </div>
              <div className="mt-2 space-y-1 text-[12px] text-[#64748B]">
                <div style={wrap}>ИНН {agent.inn}</div>
                <div style={wrap}>{agent.address}</div>
                <div style={wrap}>{agent.phone}</div>
                <div style={wrap}>{agent.email}</div>
              </div>
            </Card>
          </div>

          {offer.title && offer.title !== "Коммерческое предложение" && (
            <div
              data-pdf-block
              style={{ ...wrap, fontFamily: HEAD_FONT }}
              className="mt-7 text-[20px] font-bold text-[#0F172A]"
            >
              {offer.title}
            </div>
          )}
          {offer.intro && (
            <div
              data-pdf-block
              style={{ ...wrap, whiteSpace: "pre-line", lineHeight: 1.45 }}
              className="mt-3 text-[13px] text-[#334155]"
            >
              {offer.intro}
            </div>
          )}

          {/* Table header (repeated on continuation pages) */}
          <div
            data-pdf-block
            data-pdf-repeat
            className="mt-7 grid rounded-t-md bg-[#EFF6FF] border border-[#E2E8F0] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2563EB]"
            style={{ gridTemplateColumns: ROW_GRID }}
          >
            <div style={wrap}>Услуга</div>
            <div className="text-center" style={num}>
              Кол-во
            </div>
            <div className="text-right" style={num}>
              Цена
            </div>
            <div className="text-right" style={num}>
              Сумма
            </div>
          </div>

          {items.map((it) => (
            <div
              key={it.id}
              data-pdf-block
              className="grid border-x border-b border-[#E2E8F0] bg-white px-5 py-4"
              style={{ gridTemplateColumns: ROW_GRID, alignItems: "flex-start" }}
            >
              <div style={{ minWidth: 0, paddingRight: 16 }}>
                <div className="text-[13px] font-semibold text-[#0F172A]" style={wrap}>
                  {it.name}
                </div>
                {it.description && (
                  <div className="mt-1.5 text-[12px] text-[#64748B]" style={{ ...wrap, lineHeight: 1.45 }}>
                    {it.description}
                  </div>
                )}
              </div>
              <div className="text-center text-[12px] text-[#475569]" style={num}>
                {it.qty} {it.unit}
              </div>
              <div className="text-right text-[12px] text-[#475569]" style={num}>
                {money(it.price, offer.currency)}
              </div>
              <div className="text-right text-[13px] font-semibold text-[#0F172A]" style={num}>
                {money(Number(it.qty) * Number(it.price), offer.currency)}
              </div>
            </div>
          ))}

          <div data-pdf-block className="mt-6 flex justify-end">
            <div className="w-[320px] rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
              <div className="px-5 py-3 flex justify-between text-[12px] text-[#64748B]">
                <span>Подытог</span>
                <span style={num}>{money(offer.subtotal, offer.currency)}</span>
              </div>
              <div className="px-5 pb-3 flex justify-between text-[12px] text-[#64748B]">
                <span>НДС {offer.vat_rate}%</span>
                <span style={num}>{money(offer.vat_amount, offer.currency)}</span>
              </div>
              <div
                className="px-5 py-4 flex items-baseline justify-between text-white"
                style={{ background: "linear-gradient(135deg, #123B70 0%, #2563EB 100%)" }}
              >
                <span className="text-[11px] uppercase tracking-[0.18em]">Итого</span>
                <span style={{ ...num, fontFamily: HEAD_FONT }} className="text-[22px] font-bold">
                  {money(offer.total, offer.currency)}
                </span>
              </div>
            </div>
          </div>

          <div
            data-pdf-block
            className="mt-8 rounded-lg border border-[#E2E8F0] bg-white px-5 py-4 grid grid-cols-2 gap-6 text-[11px] text-[#64748B]"
          >
            <div style={{ minWidth: 0 }}>
              <div className="text-[12px] font-semibold text-[#0F172A] mb-1" style={wrap}>
                {agent.name}
              </div>
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

export default PremiumDark;
