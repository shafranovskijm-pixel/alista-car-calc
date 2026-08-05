import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Calculator from "./pages/Calculator.tsx";
import Services from "./pages/Services.tsx";
import Works from "./pages/Works.tsx";
import About from "./pages/About.tsx";
import Contacts from "./pages/Contacts.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import ResetPassword from "./pages/admin/ResetPassword.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminLeads from "./pages/admin/AdminLeads.tsx";
import AdminLeadDetail from "./pages/admin/AdminLeadDetail.tsx";
import AdminTasks from "./pages/admin/AdminTasks.tsx";
import AdminClients from "./pages/admin/AdminClients.tsx";
import AdminClientDetail from "./pages/admin/AdminClientDetail.tsx";
import AdminDeals from "./pages/admin/AdminDeals.tsx";
import AdminDealDetail from "./pages/admin/AdminDealDetail.tsx";
import AdminDocuments from "./pages/admin/AdminDocuments.tsx";
import AdminOffers from "./pages/admin/AdminOffers.tsx";
import AdminOfferEdit from "./pages/admin/AdminOfferEdit.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import AdminWorks from "./pages/admin/AdminWorks.tsx";
import AdminWorkEdit from "./pages/admin/AdminWorkEdit.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import AdminCars from "./pages/admin/AdminCars.tsx";
import AdminCarEdit from "./pages/admin/AdminCarEdit.tsx";
import AdminAudit from "./pages/admin/AdminAudit.tsx";
import AdminEmails from "./pages/admin/AdminEmails.tsx";
import Cars from "./pages/Cars.tsx";
import CarDetail from "./pages/CarDetail.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/services" element={<Services />} />
        <Route path="/works" element={<Works />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/cars/japan" element={<Cars />} />
        <Route path="/cars/korea" element={<Cars />} />
        <Route path="/cars/china" element={<Cars />} />
        <Route path="/cars/:slug" element={<CarDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="leads/:id" element={<AdminLeadDetail />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="clients/:id" element={<AdminClientDetail />} />
          <Route path="deals" element={<AdminDeals />} />
          <Route path="deals/:id" element={<AdminDealDetail />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="offers/new" element={<AdminOfferEdit />} />
          <Route path="offers/:id" element={<AdminOfferEdit />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="works" element={<AdminWorks />} />
          <Route path="works/:id" element={<AdminWorkEdit />} />
          <Route path="cars" element={<AdminCars />} />
          <Route path="cars/:id" element={<AdminCarEdit />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="emails" element={<AdminEmails />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
