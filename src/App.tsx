import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import MyPages from "./pages/MyPages";
import Settings from "./pages/Settings";
import ControlPlane from "./pages/ControlPlane";
import Artifacts from "./pages/Artifacts";
import SubmitSignal from "./pages/SubmitSignal";
import BulkUpload from "./pages/BulkUpload";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminFeatureFlags from "./pages/admin/AdminFeatureFlags";
import AdminSystemOverview from "./pages/admin/AdminSystemOverview";
import AdminSystemHealth from "./pages/admin/AdminSystemHealth";
import AdminWorkflows from "./pages/admin/AdminWorkflows";
import AdminApiHealth from "./pages/admin/AdminApiHealth";
import AdminCsvUpload from "./pages/admin/AdminCsvUpload";
import AdminUsageReports from "./pages/admin/AdminUsageReports";
import AdminCostDashboard from "./pages/admin/AdminCostDashboard";
import AdminTrackedPages from "./pages/admin/AdminTrackedPages";
import DemoControlPlane from "./pages/DemoControlPlane";
import DemoArtifacts from "./pages/DemoArtifacts";
import CookiePolicy from "./pages/CookiePolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import { CookieBanner } from "./components/CookieBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/messaging-diff"
              element={
                <ProtectedRoute skipOnboarding>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/control-plane"
              element={
                <ProtectedRoute skipOnboarding>
                  <ControlPlane />
                </ProtectedRoute>
              }
            />
            <Route
              path="/control-plane/artifacts"
              element={
                <ProtectedRoute skipOnboarding>
                  <Artifacts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/control-plane/submit"
              element={
                <ProtectedRoute skipOnboarding>
                  <SubmitSignal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/control-plane/upload"
              element={
                <ProtectedRoute skipOnboarding>
                  <BulkUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit-log"
              element={
                <AdminRoute>
                  <AdminAuditLog />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/feature-flags"
              element={
                <AdminRoute>
                  <AdminFeatureFlags />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/system"
              element={
                <AdminRoute>
                  <AdminSystemOverview />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/system-health"
              element={
                <AdminRoute>
                  <AdminSystemHealth />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/workflows"
              element={
                <AdminRoute>
                  <AdminWorkflows />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/api-health"
              element={
                <AdminRoute>
                  <AdminApiHealth />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/csv-upload"
              element={
                <AdminRoute>
                  <AdminCsvUpload />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/usage"
              element={
                <AdminRoute>
                  <AdminUsageReports />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/costs"
              element={
                <AdminRoute>
                  <AdminCostDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/tracked-pages"
              element={
                <AdminRoute>
                  <AdminTrackedPages />
                </AdminRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/my-pages"
              element={
                <ProtectedRoute>
                  <MyPages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            {/* Demo routes — public, no auth required */}
            <Route path="/demo/:sectorSlug" element={<DemoControlPlane />} />
            <Route path="/demo/:sectorSlug/artifacts" element={<DemoArtifacts />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
