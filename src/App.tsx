import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CheckoutProvider } from "@/contexts/CheckoutContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthErrorBoundary from "@/components/AuthErrorBoundary";
import AdminDashboard from "./components/AdminDashboard";
import AdminSetupPage from "./pages/AdminSetupPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminMFAGuard } from "@/components/AdminMFAGuard";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
// Pages
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import PaidRegister from "./pages/PaidRegister";
import UserTypeSelection from "./pages/UserTypeSelection";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import PaymentSuccess from "./pages/PaymentSuccess";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import TeamManagement from "./pages/TeamManagement";
import Billing from "./pages/Billing";
import PaymentHistory from "./pages/PaymentHistory";
import Integrations from "./pages/Integrations";
import Support from "./pages/Support";
import Documents from "./pages/Documents";
import Entities from "./pages/Entities";
import Calendar from "./pages/Calendar";
import Agents from "./pages/Agents";
import AdminAnalyticsDashboard from "./pages/AdminAnalyticsDashboard";
import AdminAuditLog from "./pages/AdminAuditLog";
import Analytics from "./pages/Analytics";
import AuditTrail from "./pages/AuditTrail";
import EntityDetails from "./pages/EntityDetails";
import ApiDocs from "./pages/ApiDocs";
import AgentDirectory from "./pages/AgentDirectory";
import AgentDashboard from "./pages/AgentDashboard";
import AgentSignup from "./pages/AgentSignup";
import EntityOwnerDashboard from "./components/EntityOwnerDashboard";
import AgentRedirect from "./pages/AgentRedirect";
import AgentRoleGuard from "./components/AgentRoleGuard";
import AgentInvitationAccept from "./pages/AgentInvitationAccept";
import AuthRedirect from "./components/AuthRedirect";
import RoleSelection from "./pages/RoleSelection";
import SignOutConfirmation from "./pages/SignOutConfirmation";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import IPReputationDashboard from "./pages/IPReputationDashboard";
import SecurityReports from "./pages/SecurityReports";

const queryClient = new QueryClient();

const App = () => {
  const [showPWAInstallPrompt, setShowPWAInstallPrompt] = React.useState(true);

  const handleDismissPWAInstall = () => {
    setShowPWAInstallPrompt(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <CheckoutProvider>
                <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/sign-out-confirmation" element={<SignOutConfirmation />} />
                
                {/* Authentication routes with error recovery */}
                <Route path="/signup" element={<AuthErrorBoundary maxRetries={3}><UserTypeSelection /></AuthErrorBoundary>} />
                <Route path="/login" element={<AuthErrorBoundary maxRetries={3}><Login /></AuthErrorBoundary>} />
                <Route path="/forgot-password" element={<AuthErrorBoundary maxRetries={3}><ForgotPassword /></AuthErrorBoundary>} />
                <Route path="/reset-password" element={<AuthErrorBoundary maxRetries={3}><ResetPassword /></AuthErrorBoundary>} />
                <Route path="/register" element={<AuthErrorBoundary maxRetries={3}><Register /></AuthErrorBoundary>} />
                <Route path="/paid-register" element={<AuthErrorBoundary maxRetries={3}><PaidRegister /></AuthErrorBoundary>} />
                <Route path="/agent-signup" element={<AuthErrorBoundary maxRetries={3}><AgentSignup /></AuthErrorBoundary>} />
                <Route path="/verify-email" element={<AuthErrorBoundary maxRetries={3}><VerifyEmail /></AuthErrorBoundary>} />
                <Route path="/registration-success" element={<AuthErrorBoundary><RegistrationSuccess /></AuthErrorBoundary>} />
                <Route path="/payment-success" element={<AuthErrorBoundary><PaymentSuccess /></AuthErrorBoundary>} />
                <Route path="/role-selection" element={<AuthErrorBoundary maxRetries={3}><ProtectedRoute><RoleSelection /></ProtectedRoute></AuthErrorBoundary>} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><AuthRedirect><EntityOwnerDashboard /></AuthRedirect></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute><AuthRedirect><AdminMFAGuard><AdminDashboard /></AdminMFAGuard></AuthRedirect></ProtectedRoute>} />
              <Route path="/entity-dashboard" element={<ProtectedRoute><AgentRoleGuard requiredRole="entity_owner"><EntityOwnerDashboard /></AgentRoleGuard></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/admin-analytics" element={<ProtectedRoute><AdminMFAGuard><AdminAnalyticsDashboard /></AdminMFAGuard></ProtectedRoute>} />
              <Route path="/admin-audit" element={<ProtectedRoute><AdminMFAGuard><AdminAuditLog /></AdminMFAGuard></ProtectedRoute>} />
              <Route path="/ip-reputation" element={<ProtectedRoute><AdminMFAGuard><IPReputationDashboard /></AdminMFAGuard></ProtectedRoute>} />
              <Route path="/security-reports" element={<ProtectedRoute><AdminMFAGuard><SecurityReports /></AdminMFAGuard></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
              <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
              <Route path="/entities" element={<ProtectedRoute><Entities /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
              <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
              <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
              <Route path="/audit" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
              <Route path="/entity/:id" element={<ProtectedRoute><EntityDetails /></ProtectedRoute>} />
              <Route path="/find-agents" element={<ProtectedRoute><AgentRoleGuard requiredRole="entity_owner"><AgentDirectory /></AgentRoleGuard></ProtectedRoute>} />
              <Route path="/agent-dashboard" element={<ProtectedRoute><AuthRedirect><AgentRoleGuard requiredRole="registered_agent"><AgentDashboard /></AgentRoleGuard></AuthRedirect></ProtectedRoute>} />
              <Route path="/admin-setup" element={<ProtectedRoute><AdminMFAGuard><AdminSetupPage /></AdminMFAGuard></ProtectedRoute>} />
              <Route path="/agent-invitation/:token" element={<ProtectedRoute><AgentInvitationAccept /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
              </Routes>
              </CheckoutProvider>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
        {showPWAInstallPrompt && (
          <PWAInstallPrompt onDismiss={handleDismissPWAInstall} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;