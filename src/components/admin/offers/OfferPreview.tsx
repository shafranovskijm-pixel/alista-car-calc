import { Offer, OfferItem } from "@/lib/offers";
import { ALISTA_AGENT } from "@/lib/contract";
import PremiumDark from "./templates/PremiumDark";
import CleanLight from "./templates/CleanLight";
import Executive from "./templates/Executive";

type Props = {
  offer: Offer;
  items: OfferItem[];
  clientName: string;
};

const AGENT = {
  name: "ООО «АЛИСТА»",
  inn: ALISTA_AGENT.agent_inn,
  address: ALISTA_AGENT.agent_address,
  phone: "+7 914 073-01-96",
  email: "info@alistaru.ru",
};

const OfferPreview = ({ offer, items, clientName }: Props) => {
  if (offer.template === "clean_light") return <CleanLight offer={offer} items={items} clientName={clientName} agent={AGENT} />;
  if (offer.template === "executive") return <Executive offer={offer} items={items} clientName={clientName} agent={AGENT} />;
  return <PremiumDark offer={offer} items={items} clientName={clientName} agent={AGENT} />;
};

export default OfferPreview;