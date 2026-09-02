import { useLocation } from "react-router-dom";
import Seo from "@/components/Seo";
import { getRouteSeo } from "@/lib/seo";

const RouteSeo = () => {
  const { pathname } = useLocation();
  return <Seo {...getRouteSeo(pathname)} />;
};

export default RouteSeo;
