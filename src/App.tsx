import { Suspense, forwardRef, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminProfileProvider } from "@/contexts/AdminProfileContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { ClientProfileProvider } from "@/contexts/ClientProfileContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthHomeRedirect, PublicRoute, RoleRoute } from "@/components/auth/AuthRoute";
import LoadingScreen from "@/components/LoadingScreen";
import PWAUpdateBanner from "@/components/PWAUpdateBanner";
import OfflineNotice from "@/components/OfflineNotice";

// Eager: landing + login (critical path)
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

// Lazy: everything else
const AvisoLegal = lazy(() => import("./pages/legal/AvisoLegal"));
const PoliticaPrivacidad = lazy(() => import("./pages/legal/PoliticaPrivacidad"));
const PoliticaCookies = lazy(() => import("./pages/legal/PoliticaCookies"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminClients = lazy(() => import("./pages/AdminClients"));
const AdminClientDetail = lazy(() => import("./pages/AdminClientDetail"));
const AdminNutrition = lazy(() => import("./pages/AdminNutrition"));
const AdminTraining = lazy(() => import("./pages/AdminTraining"));
const AdminTrainingPlanView = lazy(() => import("./pages/AdminTrainingPlanView"));
const AdminTrainingPlanDetail = lazy(() => import("./pages/AdminTrainingPlanDetail"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminQuestionnaires = lazy(() => import("./pages/AdminQuestionnaires"));
const AdminCheckins = lazy(() => import("./pages/AdminCheckins"));
const AdminProgress = lazy(() => import("./pages/AdminProgress"));
const AdminNutritionPlanDetail = lazy(() => import("./pages/AdminNutritionPlanDetail"));
const AdminNutritionPlanView = lazy(() => import("./pages/AdminNutritionPlanView"));
const AdminExerciseLibrary = lazy(() => import("./pages/AdminExerciseLibrary"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminEmailTemplates = lazy(() => import("./pages/AdminEmailTemplates"));

// Client pages
const ClientHome = lazy(() => import("./pages/client/ClientHome"));
const ClientNutrition = lazy(() => import("./pages/client/ClientNutrition"));
const ClientTraining = lazy(() => import("./pages/client/ClientTraining"));
const ClientCheckins = lazy(() => import("./pages/client/ClientCheckins"));
const ClientProgress = lazy(() => import("./pages/client/ClientProgress"));
const ClientSettings = lazy(() => import("./pages/client/ClientSettings"));

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 min — avoid re-fetching on every mount
      gcTime: 10 * 60 * 1000,   // 10 min garbage collection
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const SafeQueryClientProvider = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref} style={{ display: "contents" }}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </div>
));

SafeQueryClientProvider.displayName = "SafeQueryClientProvider";

const App = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <SafeQueryClientProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAUpdateBanner />
        <OfflineNotice />
        <AuthProvider>
          <AdminProfileProvider>
            <ClientProvider>
              <ClientProfileProvider>
              <BrowserRouter>
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/home" element={<Navigate to="/" replace />} />
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
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/install" element={<InstallPage />} />
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
                    <Route path="/admin/checkins" element={<RoleRoute allowedRole="admin"><AdminCheckins /></RoleRoute>} />
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
                </Suspense>
              </BrowserRouter>
              </ClientProfileProvider>
            </ClientProvider>
          </AdminProfileProvider>
        </AuthProvider>
      </TooltipProvider>
    </SafeQueryClientProvider>
  </div>
));

App.displayName = "App";

export default App;
