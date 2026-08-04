import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Download, Eye, Save, Send } from "lucide-react";
import HintCard from "@/components/admin/HintCard";
import ServicesPicker from "@/components/admin/offers/ServicesPicker";
import OfferItemsTable from "@/components/admin/offers/OfferItemsTable";
import OfferPreview from "@/components/admin/offers/OfferPreview";
import SendOfferDialog from "@/components/admin/offers/SendOfferDialog";
import {
  Offer,
  OfferItem,
  OfferTemplate,
  STATUS_LABEL,
  Service,
  TEMPLATE_META,
  createOffer,
  fetchOffer,
  fetchServices,
  money,
  recalcOffer,
  replaceOfferItems,
  updateOffer,
} from "@/lib/offers";
import { updateServicePrice } from "@/lib/offers";
import { supabase } from "@/integrations/supabase/proxy-client";
import { toast } from "@/hooks/use-toast";
import { blobToBase64, downloadBlob, renderOfferPdf } from "@/lib/offerPdf";

type DraftItem = Pick<OfferItem, "name" | "description" | "unit" | "qty" | "price"> & {
  service_id?: string | null;
  catalog_price?: number | null;
};

type ClientOpt = {
  id: string;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  inn: string | null;
  kpp: string | null;
  address: string | null;
  client_type: string | null;
};

const AdminOfferEdit = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [title, setTitle] = useState("Коммерческое предложение");
  const [intro, setIntro] = useState(
    "Благодарим за интерес к услугам Alista. Ниже — расчёт стоимости под ваш проект.",
  );
  const [template, setTemplate] = useState<OfferTemplate>("premium_dark");
  const [clientId, setClientId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("RUB");
  const [vatIncluded, setVatIncluded] = useState(false);
  const [vatRate, setVatRate] = useState(20);
  const [validDays, setValidDays] = useState(14);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = isNew ? "Новое КП | CRM ALISTA" : "Редактирование КП | CRM ALISTA";
  }, [isNew]);

  useEffect(() => {
    (async () => {
      const [svc, cl] = await Promise.all([
        fetchServices(),
        supabase
          .from("clients")
          .select("id, full_name, company_name, email, phone, inn, kpp, address, client_type")
          .order("full_name"),
      ]);
      setServices(svc);
      setClients((cl.data ?? []) as ClientOpt[]);
    })();
  }, []);

  useEffect(() => {
    if (isNew || !id) return;
    (async () => {
      try {
        const { offer: o, items: its } = await fetchOffer(id);
        setOffer(o);
        setTitle(o.title);
        setIntro(o.intro ?? "");
        setTemplate(o.template);
        setClientId(o.client_id);
        setCurrency(o.currency);
        setVatIncluded(o.vat_included);
        setVatRate(Number(o.vat_rate));
        setValidDays(o.valid_days);
        setItems(its.map((it) => ({ name: it.name, description: it.description, unit: it.unit, qty: Number(it.qty), price: Number(it.price) })));
      } catch (e) {
        toast({ title: "Не удалось загрузить", description: (e as Error).message, variant: "destructive" });
      }
    })();
  }, [id, isNew]);

  const totals = useMemo(() => recalcOffer(items, vatRate, vatIncluded), [items, vatRate, vatIncluded]);

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;
  const clientName = selectedClient
    ? selectedClient.company_name || selectedClient.full_name
    : "Клиент";
  const clientInfo = selectedClient
    ? {
        name: selectedClient.company_name || selectedClient.full_name,
        contact: selectedClient.company_name ? selectedClient.full_name : null,
        email: selectedClient.email,
        phone: selectedClient.phone,
        inn: selectedClient.inn,
        kpp: selectedClient.kpp,
        address: selectedClient.address,
        type: selectedClient.client_type,
      }
    : null;

  const handleClientChange = (v: string) => {
    const nextId = v === "none" ? null : v;
    setClientId(nextId);
    if (nextId) {
      const c = clients.find((x) => x.id === nextId);
      if (c) {
        const filled = [c.email, c.phone, c.inn, c.address].filter(Boolean).length;
        toast({
          title: "Клиент подставлен в КП",
          description: filled > 0
            ? `Автоматически добавлены контакты и реквизиты (${filled} поля).`
            : "У клиента не заполнены контакты и реквизиты — добавьте их в карточке клиента.",
        });
      }
    }
  };

  const addFromCatalog = (s: Service) => {
    setItems((prev) => [
      ...prev,
      {
        name: s.name,
        description: s.description,
        unit: s.unit,
        qty: 1,
        price: Number(s.base_price),
        service_id: s.id,
        catalog_price: Number(s.base_price),
      },
    ]);
  };

  const rememberPrice = async (serviceId: string, price: number) => {
    try {
      await updateServicePrice(serviceId, price);
      setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, base_price: price } : s)));
      setItems((prev) =>
        prev.map((it) => (it.service_id === serviceId ? { ...it, catalog_price: price } : it)),
      );
      toast({ title: "Цена сохранена в каталоге" });
    } catch (e) {
      toast({ title: "Не удалось сохранить цену", description: (e as Error).message, variant: "destructive" });
    }
  };
  const addCustom = () => {
    setItems((prev) => [...prev, { name: "Своя услуга", description: null, unit: "шт", qty: 1, price: 0 }]);
  };

  const save = async (opts: { silent?: boolean } = {}): Promise<Offer | null> => {
    setBusy(true);
    try {
      const patch: Partial<Offer> = {
        title,
        intro,
        template,
        client_id: clientId,
        currency,
        vat_included: vatIncluded,
        vat_rate: vatRate,
        valid_days: validDays,
        subtotal: totals.subtotal,
        vat_amount: totals.vat_amount,
        total: totals.total,
      };
      let saved: Offer;
      if (!offer) {
        saved = await createOffer(patch);
      } else {
        await updateOffer(offer.id, patch);
        saved = { ...offer, ...(patch as Offer) };
      }
      await replaceOfferItems(saved.id, items);
      setOffer(saved);
      if (!opts.silent) toast({ title: "Сохранено" });
      if (isNew) navigate(`/admin/offers/${saved.id}`, { replace: true });
      return saved;
    } catch (e) {
      toast({ title: "Не удалось сохранить", description: (e as Error).message, variant: "destructive" });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const buildPdf = async () => {
    if (!previewRef.current) return null;
    const node = previewRef.current.querySelector<HTMLElement>(".offer-a4");
    if (!node) return null;
    return renderOfferPdf(node);
  };

  const download = async () => {
    const saved = await save({ silent: true });
    if (!saved) return;
    setBusy(true);
    try {
      const blob = await buildPdf();
      if (!blob) throw new Error("Не удалось сформировать PDF");
      downloadBlob(blob, `КП-${saved.number}.pdf`);
    } catch (e) {
      toast({ title: "Ошибка PDF", description: (e as Error).message, variant: "destructive" });
    }
    setBusy(false);
  };

  const openSend = async () => {
    const saved = await save({ silent: true });
    if (!saved) return;
    setBusy(true);
    try {
      const blob = await buildPdf();
      if (!blob) throw new Error("Не удалось сформировать PDF");
      setPdfBase64(await blobToBase64(blob));
      setSendOpen(true);
    } catch (e) {
      toast({ title: "Ошибка PDF", description: (e as Error).message, variant: "destructive" });
    }
    setBusy(false);
  };

  const displayOffer: Offer = offer ?? {
    id: "draft",
    number: 0,
    client_id: clientId,
    deal_id: null,
    title,
    intro,
    template,
    currency,
    vat_included: vatIncluded,
    vat_rate: vatRate,
    valid_days: validDays,
    status: "draft",
    subtotal: totals.subtotal,
    vat_amount: totals.vat_amount,
    total: totals.total,
    sent_at: null,
    viewed_at: null,
    accepted_at: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const displayOfferMerged: Offer = {
    ...displayOffer,
    title,
    intro,
    template,
    currency,
    vat_included: vatIncluded,
    vat_rate: vatRate,
    valid_days: validDays,
    subtotal: totals.subtotal,
    vat_amount: totals.vat_amount,
    total: totals.total,
  };
  const previewItems: OfferItem[] = items.map((it, i) => ({
    id: `p-${i}`,
    offer_id: displayOffer.id,
    name: it.name,
    description: it.description ?? null,
    unit: it.unit,
    qty: Number(it.qty),
    price: Number(it.price),
    amount: Number(it.qty) * Number(it.price),
    sort_order: i,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/offers")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold">
              {offer ? `КП №${offer.number}` : "Новое КП"}
            </h1>
            {offer && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <Badge variant="secondary">{STATUS_LABEL[offer.status]}</Badge>
                <span>Обновлено {new Date(offer.updated_at).toLocaleString("ru-RU")}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => save()} disabled={busy}><Save className="h-4 w-4 mr-2" /> Сохранить</Button>
          <Button variant="outline" onClick={download} disabled={busy}><Download className="h-4 w-4 mr-2" /> PDF</Button>
          <Button onClick={openSend} disabled={busy}><Send className="h-4 w-4 mr-2" /> Отправить</Button>
        </div>
      </div>

      <HintCard title="Как это работает" storageKey="offer-edit">
        1) Выбираете клиента и шаблон дизайна. 2) Добавляете услуги из каталога слева — можно править цену и количество, а также добавить свою строку.
        3) Смотрите живой предпросмотр справа и жмёте «PDF» или «Отправить». Клиенту улетит письмо с прикреплённым КП.
      </HintCard>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Клиент</Label>
                <Select value={clientId ?? "none"} onValueChange={handleClientChange}>
                  <SelectTrigger><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Без клиента —</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company_name || c.full_name}
                        {c.company_name && c.full_name ? ` · ${c.full_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientInfo && (
                  <div className="mt-2 rounded-md border border-border bg-secondary/40 p-2 text-[11px] leading-relaxed text-muted-foreground space-y-0.5">
                    <div className="text-foreground font-medium">Подставлено в КП:</div>
                    {clientInfo.contact && <div>👤 {clientInfo.contact}</div>}
                    {clientInfo.email && <div>✉ {clientInfo.email}</div>}
                    {clientInfo.phone && <div>☎ {clientInfo.phone}</div>}
                    {clientInfo.inn && (
                      <div>
                        ИНН {clientInfo.inn}
                        {clientInfo.kpp ? ` · КПП ${clientInfo.kpp}` : ""}
                      </div>
                    )}
                    {clientInfo.address && <div>📍 {clientInfo.address}</div>}
                    {!clientInfo.email &&
                      !clientInfo.phone &&
                      !clientInfo.inn &&
                      !clientInfo.address && (
                        <div className="text-amber-500">
                          У клиента нет контактов/реквизитов. Заполните карточку клиента.
                        </div>
                      )}
                  </div>
                )}
              </div>
              <div>
                <Label>Шаблон</Label>
                <Select value={template} onValueChange={(v) => setTemplate(v as OfferTemplate)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TEMPLATE_META) as OfferTemplate[]).map((k) => (
                      <SelectItem key={k} value={k}>{TEMPLATE_META[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">{TEMPLATE_META[template].desc}</p>
              </div>
            </div>
            <div>
              <Label>Тема / заголовок</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Вступление</Label>
              <Textarea rows={3} value={intro} onChange={(e) => setIntro(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label>Валюта</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RUB">₽ RUB</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="CNY">¥ CNY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>НДС, %</Label>
                <Input type="number" value={vatRate} onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Дней</Label>
                <Input type="number" value={validDays} onChange={(e) => setValidDays(parseInt(e.target.value) || 0)} />
              </div>
              <div className="flex flex-col justify-end pb-2">
                <Label className="text-xs">НДС включён</Label>
                <Switch checked={vatIncluded} onCheckedChange={setVatIncluded} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <Tabs defaultValue="items">
              <TabsList className="grid grid-cols-2 mb-3">
                <TabsTrigger value="items">Позиции ({items.length})</TabsTrigger>
                <TabsTrigger value="catalog">Каталог услуг</TabsTrigger>
              </TabsList>
              <TabsContent value="items">
                <OfferItemsTable items={items} currency={currency} onChange={setItems} />
                <div className="mt-4 flex justify-end">
                  <div className="w-full sm:w-[300px] space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground"><span>Подытог</span><span>{money(totals.subtotal, currency)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>НДС {vatRate}%</span><span>{money(totals.vat_amount, currency)}</span></div>
                    <div className="flex justify-between text-base font-bold pt-1 border-t border-border"><span>Итого</span><span className="text-primary">{money(totals.total, currency)}</span></div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="catalog">
                <ServicesPicker services={services} onAdd={addFromCatalog} onAddCustom={addCustom} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        <div>
          <Card className="p-3 sticky top-4 bg-secondary/40">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
              <Eye className="h-3.5 w-3.5" /> Живой предпросмотр — так увидит клиент
            </div>
            <div className="rounded-md overflow-hidden border border-border bg-white">
              <div className="overflow-auto max-h-[80vh]">
                <div ref={previewRef} className="origin-top-left" style={{ transform: "scale(0.7)", transformOrigin: "top left", width: "794px" }}>
                  <OfferPreview
                    offer={displayOfferMerged}
                    items={previewItems}
                    clientName={clientName}
                    client={clientInfo}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {offer && (
        <SendOfferDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          defaultEmail={selectedClient?.email ?? ""}
          offerId={offer.id}
          offerNumber={offer.number}
          pdfBase64={pdfBase64}
          onSent={() => save({ silent: true })}
        />
      )}
    </div>
  );
};

export default AdminOfferEdit;