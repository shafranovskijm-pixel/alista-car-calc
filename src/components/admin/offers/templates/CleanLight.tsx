import { Offer, OfferItem, money } from "@/lib/offers";
import type { OfferClient } from "../OfferPreview";

type Props = {
  offer: Offer;
  items: OfferItem[];
  clientName: string;
  agent: { name: string; inn: string; address: string; phone: string; email: string };
  client?: OfferClient;
};

const CleanLight = ({ offer, items, clientName, agent, client }: Props) => (
  <div
    style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}
    className="offer-a4 bg-white text-[#0f172a] w-[794px] min-h-[1123px] p-14"
  >
    <div className="flex items-center justify-between border-b-2 border-[#2563eb] pb-5">
      <div>
        <div className="text-[10px] tracking-[0.4em] text-[#2563eb] uppercase">Alista</div>
        <div
          style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}
          className="text-[32px] font-bold mt-1"
        >
          Коммерческое предложение
        </div>
      </div>
      <div className="text-right">
        <div className="text-[11px] uppercase tracking-widest text-[#64748b]">№</div>
        <div className="text-[28px] font-bold text-[#2563eb]">{offer.number}</div>
        <div className="text-[11px] text-[#64748b]">{new Date(offer.created_at).toLocaleDateString("ru-RU")}</div>
      </div>
    </div>

    <div data-pdf-block className="mt-8 grid grid-cols-2 gap-6 text-[13px]">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[#64748b] mb-1">Клиент</div>
        <div className="text-[16px] font-semibold">{clientName || "—"}</div>
        {client && (
          <div className="mt-2 space-y-0.5 text-[11px] text-[#64748b]">
            {client.contact && <div>{client.contact}</div>}
            {client.email && <div>{client.email}</div>}
            {client.phone && <div>{client.phone}</div>}
            {client.inn && (
              <div>
                ИНН {client.inn}
                {client.kpp ? ` · КПП ${client.kpp}` : ""}
              </div>
            )}
            {client.address && <div>{client.address}</div>}
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="text-[10px] uppercase tracking-widest text-[#64748b] mb-1">Срок действия</div>
        <div className="text-[16px] font-semibold">{offer.valid_days} дн.</div>
      </div>
    </div>

    {offer.title && offer.title !== "Коммерческое предложение" && (
      <div className="mt-8 text-[18px] font-semibold">{offer.title}</div>
    )}
    {offer.intro && <div className="mt-2 text-[13px] leading-relaxed text-[#475569] whitespace-pre-line">{offer.intro}</div>}

    <table data-pdf-block className="w-full mt-8 text-[13px] border-collapse">
      <thead>
        <tr className="bg-[#eff6ff] text-[11px] uppercase tracking-wider text-[#2563eb]">
          <th className="text-left px-4 py-3 rounded-l-md">Услуга</th>
          <th className="text-center px-2 py-3">Кол-во</th>
          <th className="text-right px-2 py-3">Цена</th>
          <th className="text-right px-4 py-3 rounded-r-md">Сумма</th>
        </tr>
      </thead>
      <tbody>
        {items.map((it) => (
          <tr key={it.id} data-pdf-block className="border-b border-[#e2e8f0] align-top">
            <td className="px-4 py-3">
              <div className="font-medium">{it.name}</div>
              {it.description && <div className="text-[11px] text-[#64748b] mt-1">{it.description}</div>}
            </td>
            <td className="text-center px-2 py-3 text-[#475569]">{it.qty} {it.unit}</td>
            <td className="text-right px-2 py-3 text-[#475569]">{money(it.price, offer.currency)}</td>
            <td className="text-right px-4 py-3 font-semibold">{money(Number(it.qty) * Number(it.price), offer.currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div data-pdf-block className="mt-6 flex justify-end">
      <div className="w-[320px] space-y-2 text-[13px]">
        <div className="flex justify-between text-[#64748b]"><span>Подытог</span><span>{money(offer.subtotal, offer.currency)}</span></div>
        <div className="flex justify-between text-[#64748b]"><span>НДС {offer.vat_rate}%</span><span>{money(offer.vat_amount, offer.currency)}</span></div>
        <div className="h-[1px] bg-[#e2e8f0]" />
        <div className="flex justify-between items-baseline bg-[#2563eb] text-white rounded-md px-4 py-3">
          <span className="text-[11px] uppercase tracking-widest">Итого</span>
          <span className="text-[22px] font-bold">{money(offer.total, offer.currency)}</span>
        </div>
      </div>
    </div>

    <div data-pdf-block className="mt-16 pt-6 border-t border-[#e2e8f0] text-[10px] text-[#64748b] grid grid-cols-2 gap-4">
      <div>
        <div className="font-semibold text-[#0f172a] mb-1">{agent.name}</div>
        <div>ИНН {agent.inn}</div>
        <div>{agent.address}</div>
      </div>
      <div className="text-right">
        <div>{agent.phone}</div>
        <div>{agent.email}</div>
        <div className="mt-1 text-[#2563eb]">alistaru.ru</div>
      </div>
    </div>
  </div>
);

export default CleanLight;