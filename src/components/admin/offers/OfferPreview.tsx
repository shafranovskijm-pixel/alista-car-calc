import { Offer, OfferItem } from "@/lib/offers";
import { ALISTA_AGENT } from "@/lib/contract";
import PremiumDark from "./templates/PremiumDark";
import CleanLight from "./templates/CleanLight";
import Executive from "./templates/Executive";

export type OfferClient = {
  name: string;
  contact?: string | null;
  email?: string | null;
  phone?: string | null;
  inn?: string | null;
  kpp?: string | null;
  address?: string | null;
  type?: string | null;
} | null;

type Props = {
  offer: Offer;
  items: OfferItem[];
  clientName: string;
  client?: OfferClient;
};

const AGENT = {
  name: "ООО «АЛИСТА»",
  inn: ALISTA_AGENT.agent_inn,
  address: ALISTA_AGENT.agent_address,
  phone: "+7 914 073-01-96",
  email: "info@alistaru.ru",
};

const OfferPreview = ({ offer, items, clientName, client }: Props) => {
  const shared = { offer, items, clientName, client: client ?? null, agent: AGENT };
  if (offer.template === "clean_light") return <CleanLight {...shared} />;
  if (offer.template === "executive") return <Executive {...shared} />;
  return <PremiumDark {...shared} />;
};

export default OfferPreview;