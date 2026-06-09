import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import DocumentsList from "@/components/admin/DocumentsList";
import ClientRequisitesCard, { ClientRequisites } from "@/components/admin/ClientRequisitesCard";
import {
  CLIENT_TYPE_LABELS,
  DEAL_STAGE_COLOR,
  DEAL_STAGE_LABELS,
  DEAL_TYPE_LABELS,
  DealStage,
  DealType,
} from "@/lib/deals";

type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  client_type: "individual" | "company";
  company_name: string | null;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  director_name: string | null;
  director_position: string | null;
  passport: string | null;
  birth_date: string | null;
  passport_issued_by: string | null;
  passport_issued_date: string | null;
  address: string | null;
  note: string | null;
  source: string | null;
  created_at: string;
};

type Deal = {
  id: string;
  title: string;
  stage: DealStage;
  deal_type: DealType;
  budget: number | null;
  currency: string;
  created_at: string;
};

const AdminClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: c } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
      setClient((c ?? null) as Client | null);
      const { data: d } = await supabase
        .from("deals")
        .select("id, title, stage, deal_type, budget, currency, created_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false });
      setDeals((d ?? []) as Deal[]);
    })();
  }, [id]);

  if (!client) return <div className="text-muted-foreground">Загрузка...</div>;

  const requisites: ClientRequisites = {
    id: client.id,
    client_type: client.client_type,
    full_name: client.full_name,
    company_name: client.company_name,
    inn: client.inn,
    kpp: client.kpp,
    ogrn: client.ogrn,
    address: client.address,
    director_name: client.director_name,
    director_position: client.director_position,
    passport: client.passport,
    birth_date: client.birth_date,
    passport_issued_by: client.passport_issued_by,
    passport_issued_date: client.passport_issued_date,
    phone: client.phone,
    email: client.email,
    note: client.note,
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <Button asChild variant="ghost" size="sm">
        <Link to="/admin/clients"><ArrowLeft className="h-4 w-4 mr-1" /> К списку</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{client.full_name}</CardTitle>
            <Badge variant="outline">{CLIENT_TYPE_LABELS[client.client_type]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="Источник" value={client.source ?? "—"} />
          <Row label="Создан" value={new Date(client.created_at).toLocaleString("ru-RU")} />
        </CardContent>
      </Card>

      <ClientRequisitesCard
        client={requisites}
        onSaved={(r) => setClient((c) => (c ? { ...c, ...r } as Client : c))}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Сделки клиента</CardTitle>
        </CardHeader>
        <CardContent>
          {deals.length === 0 ? (
            <div className="text-sm text-muted-foreground">Сделок нет</div>
          ) : (
            <ul className="space-y-2">
              {deals.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <Link to={`/admin/deals/${d.id}`} className="hover:underline">
                    {d.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{DEAL_TYPE_LABELS[d.deal_type]}</span>
                    <span className={`px-2 py-0.5 rounded border text-xs ${DEAL_STAGE_COLOR[d.stage]}`}>
                      {DEAL_STAGE_LABELS[d.stage]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Документы клиента</CardTitle></CardHeader>
        <CardContent>
          <DocumentsList clientId={client.id} />
        </CardContent>
      </Card>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-3 py-1 border-b border-border/40 last:border-0">
    <div className="text-muted-foreground">{label}</div>
    <div className="col-span-2">{value}</div>
  </div>
);

export default AdminClientDetail;