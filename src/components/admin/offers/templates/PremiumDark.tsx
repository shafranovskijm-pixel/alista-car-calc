import { Offer, OfferItem, money } from "@/lib/offers";

type Props = {
  offer: Offer;
  items: OfferItem[];
  clientName: string;
  agent: { name: string; inn: string; address: string; phone: string; email: string };
};

const PremiumDark = ({ offer, items, clientName, agent }: Props) => (
  <div
    style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}
    className="offer-a4 bg-[#0b1220] text-[#e8ecf5] w-[794px] min-h-[1123px] p-14 relative overflow-hidden"
  >
    {/* decorative glow */}
    <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-[#3b82f6] opacity-20 blur-3xl" />
    <div className="absolute bottom-0 -left-24 w-[320px] h-[320px] rounded-full bg-[#22d3ee] opacity-10 blur-3xl" />

    <div className="relative z-10 flex items-start justify-between">
      <div>
        <div className="text-[10px] tracking-[0.4em] text-[#7fb0ff] uppercase mb-3">Alista · Владивосток</div>
        <div
          style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}
          className="text-[42px] leading-[1.05] font-bold"
        >
          Коммерческое<br/>предложение
        </div>
      </div>
      <div className="text-right">
        <div className="text-[11px] uppercase tracking-widest text-[#94a3b8]">№ КП</div>
        <div className="text-[32px] font-bold text-[#60a5fa]">{offer.number}</div>
        <div className="mt-3 text-[11px] text-[#94a3b8]">
          {new Date(offer.created_at).toLocaleDateString("ru-RU")}
        </div>
        <div className="text-[11px] text-[#94a3b8]">Действует {offer.valid_days} дн.</div>
      </div>
    </div>

    <div className="mt-8 h-[2px] bg-gradient-to-r from-transparent via-[#3b82f6] to-transparent" />

    <div className="mt-8 grid grid-cols-2 gap-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-[10px] uppercase tracking-widest text-[#94a3b8] mb-2">Для кого</div>
        <div className="text-[16px] font-semibold">{clientName || "—"}</div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-[10px] uppercase tracking-widest text-[#94a3b8] mb-2">От кого</div>
        <div className="text-[16px] font-semibold">{agent.name}</div>
        <div className="text-[11px] text-[#94a3b8] mt-1">ИНН {agent.inn}</div>
      </div>
    </div>

    {offer.title && offer.title !== "Коммерческое предложение" && (
      <div
        style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}
        className="mt-8 text-[22px] font-semibold text-white"
      >
        {offer.title}
      </div>
    )}
    {offer.intro && <div className="mt-3 text-[13px] leading-relaxed text-[#cbd5e1] whitespace-pre-line">{offer.intro}</div>}

    <div className="mt-8 rounded-xl border border-white/10 overflow-hidden">
      <div className="grid grid-cols-[1fr_60px_120px_140px] px-5 py-3 text-[11px] uppercase tracking-widest text-[#94a3b8] bg-white/[0.03]">
        <div>Услуга</div>
        <div className="text-center">Кол-во</div>
        <div className="text-right">Цена</div>
        <div className="text-right">Сумма</div>
      </div>
      {items.map((it) => (
        <div key={it.id} className="grid grid-cols-[1fr_60px_120px_140px] px-5 py-4 border-t border-white/5 items-start">
          <div>
            <div className="text-[14px] font-medium">{it.name}</div>
            {it.description && <div className="text-[11px] text-[#94a3b8] mt-1">{it.description}</div>}
          </div>
          <div className="text-center text-[13px] text-[#cbd5e1]">{it.qty} {it.unit}</div>
          <div className="text-right text-[13px] text-[#cbd5e1]">{money(it.price, offer.currency)}</div>
          <div className="text-right text-[14px] font-semibold text-white">{money(Number(it.qty) * Number(it.price), offer.currency)}</div>
        </div>
      ))}
    </div>

    <div className="mt-6 flex justify-end">
      <div className="w-[320px] rounded-xl bg-gradient-to-br from-[#1e40af]/50 to-[#0ea5e9]/20 border border-[#3b82f6]/40 p-5 space-y-2">
        <div className="flex justify-between text-[12px] text-[#cbd5e1]">
          <span>Подытог</span><span>{money(offer.subtotal, offer.currency)}</span>
        </div>
        <div className="flex justify-between text-[12px] text-[#cbd5e1]">
          <span>НДС {offer.vat_rate}%</span><span>{money(offer.vat_amount, offer.currency)}</span>
        </div>
        <div className="h-px bg-white/10" />
        <div className="flex justify-between items-baseline">
          <span className="text-[12px] uppercase tracking-widest text-[#94a3b8]">Итого</span>
          <span
            style={{ fontFamily: "'Space Grotesk','Inter',sans-serif" }}
            className="text-[26px] font-bold text-white"
          >
            {money(offer.total, offer.currency)}
          </span>
        </div>
      </div>
    </div>

    <div className="mt-12 pt-6 border-t border-white/10 text-[10px] text-[#94a3b8] flex justify-between">
      <div>
        <div className="font-semibold text-[#cbd5e1] mb-1">{agent.name}</div>
        <div>ИНН {agent.inn}</div>
        <div className="max-w-[380px]">{agent.address}</div>
      </div>
      <div className="text-right">
        <div>{agent.phone}</div>
        <div>{agent.email}</div>
        <div className="mt-2 text-[#60a5fa]">alistaru.ru</div>
      </div>
    </div>
  </div>
);

export default PremiumDark;