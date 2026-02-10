import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CookieBanner } from "./components/CookieBanner";

// ---------------------------------------------------------------------------
// Eagerly loaded pages (critical path — above the fold / first interaction)
// ---------------------------------------------------------------------------
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ControlPlane from "./pages/ControlPlane";
import NotFound from "./pages/NotFound";

// ---------------------------------------------------------------------------
// Lazy-loaded pages (code-split into separate chunks)
// ---------------------------------------------------------------------------

// Core pages
const Index = lazy(() => import("./pages/Index"));
const MyPages = lazy(() => import("./pages/MyPages"));
const Settings = lazy(() => import("./pages/Settings"));
const Artifacts = lazy(() => import("./pages/Artifacts"));
const SubmitSignal = lazy(() => import("./pages/SubmitSignal"));
const BulkUpload = lazy(() => import("./pages/BulkUpload"));
const ActionBoard = lazy(() => import("./pages/ActionBoard"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));

// Control Plane sub-pages
const TeamSettings = lazy(() => import("./components/control-plane/TeamSettings"));
const DealLogger = lazy(() => import("./components/control-plane/DealLogger"));

// Demo pages
const DemoControlPlane = lazy(() => import("./pages/DemoControlPlane"));
const DemoArtifacts = lazy(() => import("./pages/DemoArtifacts"));
const DemoActionBoard = lazy(() => import("./pages/DemoActionBoard"));

// Legal
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminFeatureFlags = lazy(() => import("./pages/admin/AdminFeatureFlags"));
const AdminSystemOverview = lazy(() => import("./pages/admin/AdminSystemOverview"));
const AdminSystemHealth = lazy(() => import("./pages/admin/AdminSystemHealth"));
const AdminWorkflows = lazy(() => import("./pages/admin/AdminWorkflows"));
const AdminApiHealth = lazy(() => import("./pages/admin/AdminApiHealth"));
const AdminCsvUpload = lazy(() => import("./pages/admin/AdminCsvUpload"));
const AdminUsageReports = lazy(() => import("./pages/admin/AdminUsageReports"));
const AdminCostDashboard = lazy(() => import("./pages/admin/AdminCostDashboard"));
const AdminTrackedPages = lazy(() => import("./pages/admin/AdminTrackedPages"));

// ---------------------------------------------------------------------------
// Page loader — shown while lazy chunks download
// ---------------------------------------------------------------------------
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
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
                {/* Action Board */}
                <Route
                  path="/control-plane/board"
                  element={
                    <ProtectedRoute skipOnboarding>
                      <ActionBoard />
                    </ProtectedRoute>
                  }
                />
                {/* Team & Deals routes */}
                <Route
                  path="/control-plane/team"
                  element={
                    <ProtectedRoute skipOnboarding>
                      <TeamSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/control-plane/deals"
                  element={
                    <ProtectedRoute skipOnboarding>
                      <DealLogger />
                    </ProtectedRoute>
                  }
                />
                {/* Invite accept — public (handles its own auth check) */}
                <Route path="/invite/:token" element={<InviteAccept />} />
                {/* Demo routes — public, no auth required */}
                <Route path="/demo/:sectorSlug" element={<DemoControlPlane />} />
                <Route path="/demo/:sectorSlug/artifacts" element={<DemoArtifacts />} />
                <Route path="/demo/:sectorSlug/board" element={<DemoActionBoard />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CookieBanner />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  </ThemeProvider>
);

export default App;
