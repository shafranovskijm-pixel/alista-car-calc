import { Offer, OfferItem, money } from "@/lib/offers";

type Props = {
  offer: Offer;
  items: OfferItem[];
  clientName: string;
  agent: { name: string; inn: string; address: string; phone: string; email: string };
};

const Executive = ({ offer, items, clientName, agent }: Props) => (
  <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }} className="offer-a4">
    {/* Cover page */}
    <div className="w-[794px] h-[1123px] bg-[#0f172a] text-white p-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0369a1]/40" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl" />

      <div className="relative z-10 h-full flex flex-col">
        <div className="text-[11px] tracking-[0.5em] text-[#7fb0ff] uppercase">Alista · Executive</div>

        <div className="mt-auto mb-auto">
          <div className="text-[14px] uppercase tracking-widest text-[#94a3b8]">Коммерческое предложение</div>
          <div
            style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}
            className="text-[120px] leading-none font-bold text-white mt-4"
          >
            №{offer.number}
          </div>
          <div className="mt-6 text-[24px] font-semibold text-[#e2e8f0] max-w-[560px]">
            {offer.title}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-6 text-[12px]">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#94a3b8]">Подготовлено для</div>
            <div className="text-[18px] font-semibold text-white mt-1">{clientName || "—"}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-[#94a3b8]">Дата · Действует</div>
            <div className="text-[16px] font-semibold text-white mt-1">
              {new Date(offer.created_at).toLocaleDateString("ru-RU")} · {offer.valid_days} дн.
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Details page */}
    <div className="w-[794px] min-h-[1123px] bg-white text-[#0f172a] p-14">
      <div className="flex justify-between items-center border-b border-[#e2e8f0] pb-4">
        <div className="text-[11px] tracking-[0.4em] text-[#2563eb] uppercase">Смета · КП №{offer.number}</div>
        <div className="text-[11px] text-[#64748b]">{agent.name}</div>
      </div>

      {offer.intro && (
        <div className="mt-6 text-[13px] leading-relaxed text-[#334155] whitespace-pre-line">{offer.intro}</div>
      )}

      <table className="w-full mt-6 text-[13px] border-collapse">
        <thead>
          <tr className="border-b-2 border-[#0f172a] text-[11px] uppercase tracking-wider text-[#0f172a]">
            <th className="text-left py-3">Услуга</th>
            <th className="text-center py-3 w-[70px]">Кол-во</th>
            <th className="text-right py-3 w-[110px]">Цена</th>
            <th className="text-right py-3 w-[130px]">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-[#e2e8f0] align-top">
              <td className="py-4">
                <div className="font-semibold">{it.name}</div>
                {it.description && <div className="text-[11px] text-[#64748b] mt-1 leading-relaxed">{it.description}</div>}
              </td>
              <td className="text-center py-4 text-[#475569]">{it.qty} {it.unit}</td>
              <td className="text-right py-4 text-[#475569]">{money(it.price, offer.currency)}</td>
              <td className="text-right py-4 font-semibold">{money(Number(it.qty) * Number(it.price), offer.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 flex justify-end">
        <div className="w-[360px]">
          <div className="flex justify-between text-[13px] text-[#64748b] py-2"><span>Подытог</span><span>{money(offer.subtotal, offer.currency)}</span></div>
          <div className="flex justify-between text-[13px] text-[#64748b] py-2 border-b border-[#e2e8f0]"><span>НДС {offer.vat_rate}%</span><span>{money(offer.vat_amount, offer.currency)}</span></div>
          <div className="flex justify-between items-baseline pt-4">
            <span className="text-[12px] uppercase tracking-widest text-[#64748b]">К оплате</span>
            <span style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }} className="text-[32px] font-bold text-[#2563eb]">{money(offer.total, offer.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-6 text-[12px] border-t border-[#e2e8f0] pt-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#64748b] mb-2">Сроки</div>
          <div className="text-[#0f172a]">Начало работ — в течение 3 рабочих дней после подписания договора.</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#64748b] mb-2">Оплата</div>
          <div className="text-[#0f172a]">50% предоплата, 50% по факту выполнения этапа.</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#64748b] mb-2">Гарантии</div>
          <div className="text-[#0f172a]">Полное сопровождение сделки и возврат средств при невозможности исполнения.</div>
        </div>
      </div>

      <div className="mt-16 pt-6 border-t border-[#e2e8f0] text-[10px] text-[#64748b] grid grid-cols-2 gap-4">
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
  </div>
);

export default Executive;