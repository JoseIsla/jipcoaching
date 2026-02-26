import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminProfileProvider } from "@/contexts/AdminProfileContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthHomeRedirect, PublicRoute, RoleRoute } from "@/components/auth/AuthRoute";
import LoginPage from "./pages/LoginPage";
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
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AuthHomeRedirect />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
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
          </ClientProvider>
        </AdminProfileProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

