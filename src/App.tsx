import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminProfileProvider } from "@/contexts/AdminProfileContext";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminClients from "./pages/AdminClients";
import AdminClientDetail from "./pages/AdminClientDetail";
import AdminNutrition from "./pages/AdminNutrition";
import AdminTraining from "./pages/AdminTraining";
import AdminSettings from "./pages/AdminSettings";
import AdminQuestionnaires from "./pages/AdminQuestionnaires";
import AdminProgress from "./pages/AdminProgress";
import AdminNutritionPlanDetail from "./pages/AdminNutritionPlanDetail";
import AdminNutritionPlanView from "./pages/AdminNutritionPlanView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdminProfileProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/clients/:id" element={<AdminClientDetail />} />
            <Route path="/admin/nutrition" element={<AdminNutrition />} />
            <Route path="/admin/nutrition/:planId" element={<AdminNutritionPlanView />} />
            <Route path="/admin/nutrition/:planId/edit" element={<AdminNutritionPlanDetail />} />
            <Route path="/admin/training" element={<AdminTraining />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/questionnaires" element={<AdminQuestionnaires />} />
            <Route path="/admin/progress" element={<AdminProgress />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdminProfileProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
