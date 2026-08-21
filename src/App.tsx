import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";

const Index = lazy(() => import("./pages/Index.tsx"));
const Calculator = lazy(() => import("./pages/Calculator.tsx"));
const Services = lazy(() => import("./pages/Services.tsx"));
const Works = lazy(() => import("./pages/Works.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Contacts = lazy(() => import("./pages/Contacts.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Cars = lazy(() => import("./pages/Cars.tsx"));
const CarDetail = lazy(() => import("./pages/CarDetail.tsx"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.tsx"));
const ResetPassword = lazy(() => import("./pages/admin/ResetPassword.tsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.tsx"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads.tsx"));
const AdminLeadDetail = lazy(() => import("./pages/admin/AdminLeadDetail.tsx"));
const AdminTasks = lazy(() => import("./pages/admin/AdminTasks.tsx"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients.tsx"));
const AdminClientDetail = lazy(() => import("./pages/admin/AdminClientDetail.tsx"));
const AdminDeals = lazy(() => import("./pages/admin/AdminDeals.tsx"));
const AdminDealDetail = lazy(() => import("./pages/admin/AdminDealDetail.tsx"));
const AdminDocuments = lazy(() => import("./pages/admin/AdminDocuments.tsx"));
const AdminOffers = lazy(() => import("./pages/admin/AdminOffers.tsx"));
const AdminOfferEdit = lazy(() => import("./pages/admin/AdminOfferEdit.tsx"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports.tsx"));
const AdminWorks = lazy(() => import("./pages/admin/AdminWorks.tsx"));
const AdminWorkEdit = lazy(() => import("./pages/admin/AdminWorkEdit.tsx"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings.tsx"));
const AdminCars = lazy(() => import("./pages/admin/AdminCars.tsx"));
const AdminCarEdit = lazy(() => import("./pages/admin/AdminCarEdit.tsx"));
const AdminAudit = lazy(() => import("./pages/admin/AdminAudit.tsx"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails.tsx"));

const queryClient = new QueryClient();

const routeFallback = (
  <div
    className="flex min-h-[35vh] items-center justify-center px-4 text-sm text-muted-foreground"
    role="status"
    aria-live="polite"
    aria-label="Загрузка страницы"
  >
    Загрузка…
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={routeFallback}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Index />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/services" element={<Services />} />
          <Route path="/works" element={<Works />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/japan" element={<Cars countrySlug="japan" />} />
          <Route path="/cars/korea" element={<Cars countrySlug="korea" />} />
          <Route path="/cars/china" element={<Cars countrySlug="china" />} />
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
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
