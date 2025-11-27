import React from 'react';
import { RouteObject } from 'react-router-dom';
import AuthErrorBoundary from '@/components/AuthErrorBoundary';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminMFAGuard } from '@/components/AdminMFAGuard';
import AgentRoleGuard from '@/components/AgentRoleGuard';
import AuthRedirect from '@/components/AuthRedirect';

// Lazy load pages for better performance
const Landing = React.lazy(() => import('@/pages/Landing'));
const Terms = React.lazy(() => import('@/pages/Terms'));
const Privacy = React.lazy(() => import('@/pages/Privacy'));
const SignOutConfirmation = React.lazy(() => import('@/pages/SignOutConfirmation'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));

// Auth pages
const Login = React.lazy(() => import('@/pages/Login'));
const UserTypeSelection = React.lazy(() => import('@/pages/UserTypeSelection'));
const ForgotPassword = React.lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('@/pages/ResetPassword'));
const Register = React.lazy(() => import('@/pages/Register'));
const PaidRegister = React.lazy(() => import('@/pages/PaidRegister'));
const AgentSignup = React.lazy(() => import('@/pages/AgentSignup'));
const VerifyEmail = React.lazy(() => import('@/pages/VerifyEmail'));
const RegistrationSuccess = React.lazy(() => import('@/pages/RegistrationSuccess'));
const PaymentSuccess = React.lazy(() => import('@/pages/PaymentSuccess'));
const RoleSelection = React.lazy(() => import('@/pages/RoleSelection'));

// Protected pages
const EntityOwnerDashboard = React.lazy(() => import('@/components/EntityOwnerDashboard'));
const AdminDashboard = React.lazy(() => import('@/components/AdminDashboard'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const Reports = React.lazy(() => import('@/pages/Reports'));
const AdminAnalyticsDashboard = React.lazy(() => import('@/pages/AdminAnalyticsDashboard'));
const AdminAuditLog = React.lazy(() => import('@/pages/AdminAuditLog'));
const IPReputationDashboard = React.lazy(() => import('@/pages/IPReputationDashboard'));
const SecurityReports = React.lazy(() => import('@/pages/SecurityReports'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const TeamManagement = React.lazy(() => import('@/pages/TeamManagement'));
const Billing = React.lazy(() => import('@/pages/Billing'));
const PaymentHistory = React.lazy(() => import('@/pages/PaymentHistory'));
const Integrations = React.lazy(() => import('@/pages/Integrations'));
const Entities = React.lazy(() => import('@/pages/Entities'));
const Calendar = React.lazy(() => import('@/pages/Calendar'));
const Agents = React.lazy(() => import('@/pages/Agents'));
const Documents = React.lazy(() => import('@/pages/Documents'));
const Support = React.lazy(() => import('@/pages/Support'));
const AuditTrail = React.lazy(() => import('@/pages/AuditTrail'));
const EntityDetails = React.lazy(() => import('@/pages/EntityDetails'));
const AgentDirectory = React.lazy(() => import('@/pages/AgentDirectory'));
const AgentDashboard = React.lazy(() => import('@/pages/AgentDashboard'));
const AdminSetupPage = React.lazy(() => import('@/pages/AdminSetupPage'));
const AgentInvitationAccept = React.lazy(() => import('@/pages/AgentInvitationAccept'));

// Wrapper components for consistent error handling
const withAuthErrorBoundary = (Component: React.ComponentType, maxRetries = 3) => (
  <AuthErrorBoundary maxRetries={maxRetries}>
    <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <Component />
    </React.Suspense>
  </AuthErrorBoundary>
);

const withProtectedRoute = (Component: React.ComponentType) => (
  <ErrorBoundary>
    <ProtectedRoute>
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <Component />
      </React.Suspense>
    </ProtectedRoute>
  </ErrorBoundary>
);

const withAdminGuard = (Component: React.ComponentType) => (
  <ErrorBoundary>
    <ProtectedRoute>
      <AuthRedirect>
        <AdminMFAGuard>
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <Component />
          </React.Suspense>
        </AdminMFAGuard>
      </AuthRedirect>
    </ProtectedRoute>
  </ErrorBoundary>
);

const withAgentGuard = (Component: React.ComponentType, requiredRole: 'registered_agent' | 'entity_owner') => (
  <ErrorBoundary>
    <ProtectedRoute>
      <AuthRedirect>
        <AgentRoleGuard requiredRole={requiredRole}>
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <Component />
          </React.Suspense>
        </AgentRoleGuard>
      </AuthRedirect>
    </ProtectedRoute>
  </ErrorBoundary>
);

// Public routes
export const publicRoutes = [
  { path: '/', element: <React.Suspense fallback={null}><Landing /></React.Suspense> },
  { path: '/terms', element: <React.Suspense fallback={null}><Terms /></React.Suspense> },
  { path: '/privacy', element: <React.Suspense fallback={null}><Privacy /></React.Suspense> },
  { path: '/sign-out-confirmation', element: <React.Suspense fallback={null}><SignOutConfirmation /></React.Suspense> },
];

// Authentication routes with error recovery
export const authRoutes = [
  { path: '/signup', element: withAuthErrorBoundary(UserTypeSelection) },
  { path: '/login', element: withAuthErrorBoundary(Login) },
  { path: '/forgot-password', element: withAuthErrorBoundary(ForgotPassword) },
  { path: '/reset-password', element: withAuthErrorBoundary(ResetPassword) },
  { path: '/register', element: withAuthErrorBoundary(Register) },
  { path: '/paid-register', element: withAuthErrorBoundary(PaidRegister) },
  { path: '/agent-signup', element: withAuthErrorBoundary(AgentSignup) },
  { path: '/verify-email', element: withAuthErrorBoundary(VerifyEmail) },
  { path: '/registration-success', element: withAuthErrorBoundary(RegistrationSuccess, 0) },
  { path: '/payment-success', element: withAuthErrorBoundary(PaymentSuccess, 0) },
  { 
    path: '/role-selection', 
    element: (
      <AuthErrorBoundary maxRetries={3}>
        <ProtectedRoute>
          <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <RoleSelection />
          </React.Suspense>
        </ProtectedRoute>
      </AuthErrorBoundary>
    )
  },
];

// Protected routes with consistent error boundaries
export const protectedRoutes = [
  { 
    path: '/dashboard', 
    element: (
      <ErrorBoundary>
        <ProtectedRoute>
          <AuthRedirect>
            <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
              <EntityOwnerDashboard />
            </React.Suspense>
          </AuthRedirect>
        </ProtectedRoute>
      </ErrorBoundary>
    )
  },
  { path: '/admin-dashboard', element: withAdminGuard(AdminDashboard) },
  { path: '/entity-dashboard', element: withAgentGuard(EntityOwnerDashboard, 'entity_owner') },
  { path: '/settings', element: withProtectedRoute(Settings) },
  { path: '/reports', element: withProtectedRoute(Reports) },
  { path: '/admin-analytics', element: withAdminGuard(AdminAnalyticsDashboard) },
  { path: '/admin-audit', element: withAdminGuard(AdminAuditLog) },
  { path: '/ip-reputation', element: withAdminGuard(IPReputationDashboard) },
  { path: '/security-reports', element: withAdminGuard(SecurityReports) },
  { path: '/analytics', element: withProtectedRoute(Analytics) },
  { path: '/team', element: withProtectedRoute(TeamManagement) },
  { path: '/billing', element: withProtectedRoute(Billing) },
  { path: '/payments', element: withProtectedRoute(PaymentHistory) },
  { path: '/integrations', element: withProtectedRoute(Integrations) },
  { path: '/entities', element: withProtectedRoute(Entities) },
  { path: '/calendar', element: withProtectedRoute(Calendar) },
  { path: '/agents', element: withProtectedRoute(Agents) },
  { path: '/documents', element: withProtectedRoute(Documents) },
  { path: '/support', element: withProtectedRoute(Support) },
  { path: '/audit', element: withProtectedRoute(AuditTrail) },
  { path: '/entity/:id', element: withProtectedRoute(EntityDetails) },
  { path: '/find-agents', element: withAgentGuard(AgentDirectory, 'entity_owner') },
  { path: '/agent-dashboard', element: withAgentGuard(AgentDashboard, 'registered_agent') },
  { path: '/admin-setup', element: withAdminGuard(AdminSetupPage) },
  { path: '/agent-invitation/:token', element: withProtectedRoute(AgentInvitationAccept) },
];

// Catch-all route
export const fallbackRoute = { 
  path: '*', 
  element: <React.Suspense fallback={null}><NotFound /></React.Suspense> 
};

// Combined routes for export
export const allRoutes = [...publicRoutes, ...authRoutes, ...protectedRoutes, fallbackRoute];
