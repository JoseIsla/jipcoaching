import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminProfileProvider } from "@/contexts/AdminProfileContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { ClientProfileProvider } from "@/contexts/ClientProfileContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthHomeRedirect, PublicRoute, RoleRoute } from "@/components/auth/AuthRoute";
import LandingPage from "./pages/LandingPage";
import AvisoLegal from "./pages/legal/AvisoLegal";
import PoliticaPrivacidad from "./pages/legal/PoliticaPrivacidad";
import PoliticaCookies from "./pages/legal/PoliticaCookies";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminClients from "./pages/AdminClients";
import AdminClientDetail from "./pages/AdminClientDetail";
import AdminNutrition from "./pages/AdminNutrition";
import AdminTraining from "./pages/AdminTraining";
import AdminTrainingPlanView from "./pages/AdminTrainingPlanView";
import AdminTrainingPlanDetail from "./pages/AdminTrainingPlanDetail";
import AdminSettings from "./pages/AdminSettings";
import AdminQuestionnaires from "./pages/AdminQuestionnaires";
import AdminProgress from "./pages/AdminProgress";
import AdminNutritionPlanDetail from "./pages/AdminNutritionPlanDetail";
import AdminNutritionPlanView from "./pages/AdminNutritionPlanView";
import AdminExerciseLibrary from "./pages/AdminExerciseLibrary";
import AdminLeads from "./pages/AdminLeads";
import AdminEmailTemplates from "./pages/AdminEmailTemplates";
import ClientHome from "./pages/client/ClientHome";
import ClientNutrition from "./pages/client/ClientNutrition";
import ClientTraining from "./pages/client/ClientTraining";
import ClientCheckins from "./pages/client/ClientCheckins";
import ClientProgress from "./pages/client/ClientProgress";
import ClientSettings from "./pages/client/ClientSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AdminProfileProvider>
          <ClientProvider>
            <ClientProfileProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<LandingPage />} />
                <Route path="/legal/aviso-legal" element={<AvisoLegal />} />
                <Route path="/legal/privacidad" element={<PoliticaPrivacidad />} />
                <Route path="/legal/cookies" element={<PoliticaCookies />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/admin" element={<RoleRoute allowedRole="admin"><AdminDashboard /></RoleRoute>} />
                <Route path="/admin/clients" element={<RoleRoute allowedRole="admin"><AdminClients /></RoleRoute>} />
                <Route path="/admin/clients/:id" element={<RoleRoute allowedRole="admin"><AdminClientDetail /></RoleRoute>} />
                <Route path="/admin/nutrition" element={<RoleRoute allowedRole="admin"><AdminNutrition /></RoleRoute>} />
                <Route path="/admin/nutrition/:planId" element={<RoleRoute allowedRole="admin"><AdminNutritionPlanView /></RoleRoute>} />
                <Route path="/admin/nutrition/:planId/edit" element={<RoleRoute allowedRole="admin"><AdminNutritionPlanDetail /></RoleRoute>} />
                <Route path="/admin/training" element={<RoleRoute allowedRole="admin"><AdminTraining /></RoleRoute>} />
                <Route path="/admin/training/:planId" element={<RoleRoute allowedRole="admin"><AdminTrainingPlanView /></RoleRoute>} />
                <Route path="/admin/training/:planId/edit" element={<RoleRoute allowedRole="admin"><AdminTrainingPlanDetail /></RoleRoute>} />
                <Route path="/admin/exercises" element={<RoleRoute allowedRole="admin"><AdminExerciseLibrary /></RoleRoute>} />
                <Route path="/admin/leads" element={<RoleRoute allowedRole="admin"><AdminLeads /></RoleRoute>} />
                <Route path="/admin/emails" element={<RoleRoute allowedRole="admin"><AdminEmailTemplates /></RoleRoute>} />
                <Route path="/admin/settings" element={<RoleRoute allowedRole="admin"><AdminSettings /></RoleRoute>} />
                <Route path="/admin/questionnaires" element={<RoleRoute allowedRole="admin"><AdminQuestionnaires /></RoleRoute>} />
                <Route path="/admin/progress" element={<RoleRoute allowedRole="admin"><AdminProgress /></RoleRoute>} />
                <Route path="/client" element={<RoleRoute allowedRole="client"><ClientHome /></RoleRoute>} />
                <Route path="/client/nutrition" element={<RoleRoute allowedRole="client"><ClientNutrition /></RoleRoute>} />
                <Route path="/client/training" element={<RoleRoute allowedRole="client"><ClientTraining /></RoleRoute>} />
                <Route path="/client/checkins" element={<RoleRoute allowedRole="client"><ClientCheckins /></RoleRoute>} />
                <Route path="/client/progress" element={<RoleRoute allowedRole="client"><ClientProgress /></RoleRoute>} />
                <Route path="/client/settings" element={<RoleRoute allowedRole="client"><ClientSettings /></RoleRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </ClientProfileProvider>
          </ClientProvider>
        </AdminProfileProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

