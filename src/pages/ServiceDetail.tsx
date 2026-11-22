import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { ServiceDetailContent } from "@/components/VehicleServiceContent";
import { findVehicleService } from "@/lib/vehicle-services";
import NotFound from "./NotFound";

const ServiceDetail = () => {
  const { slug = "" } = useParams();
  const service = findVehicleService(slug);
  return service ? <Layout><ServiceDetailContent service={service} /></Layout> : <NotFound />;
};
export default ServiceDetail;
