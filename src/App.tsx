import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminDashboard from "./components/AdminDashboard";
import AdminSetupPage from "./pages/AdminSetupPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
// Pages
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<UserTypeSelection />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/register" element={<Register />} />
            <Route path="/paid-register" element={<PaidRegister />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/entity-dashboard" element={<ProtectedRoute><AgentRoleGuard requiredRole="entity_owner"><EntityOwnerDashboard /></AgentRoleGuard></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
            <Route path="/entity/:id" element={<ProtectedRoute><EntityDetails /></ProtectedRoute>} />
            <Route path="/find-agents" element={<ProtectedRoute><AgentRoleGuard requiredRole="entity_owner"><AgentDirectory /></AgentRoleGuard></ProtectedRoute>} />
            <Route path="/agent-dashboard" element={<ProtectedRoute><AgentRoleGuard requiredRole="registered_agent"><AgentDashboard /></AgentRoleGuard></ProtectedRoute>} />
            <Route path="/admin-setup" element={<ProtectedRoute><AdminSetupPage /></ProtectedRoute>} />
            <Route path="/agent-invitation/:token" element={<AgentInvitationAccept />} />
            <Route path="/agent-signup" element={<AgentSignup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;