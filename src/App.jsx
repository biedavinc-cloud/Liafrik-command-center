import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import AppShell from '@/components/shell/AppShell';
// Add page imports here
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Overview from '@/pages/Overview';
import Applications from '@/pages/Applications';
import CreateApplication from '@/pages/CreateApplication';
import ApplicationDetail from '@/pages/ApplicationDetail';
import Monitoring from '@/pages/Monitoring';
import Environments from '@/pages/Environments';
import Notifications from '@/pages/Notifications';
import AuditLogs from '@/pages/AuditLogs';
import Administrators from '@/pages/Administrators';
import Roles from '@/pages/Roles';
import Integrations from '@/pages/Integrations';
import Users from '@/pages/Users';
import Analytics from '@/pages/Analytics';
import Revenue from '@/pages/Revenue';
import Settings from '@/pages/Settings';
import Security from '@/pages/Security';
import Incidents from '@/pages/Incidents';
import ApiLogs from '@/pages/ApiLogs';
import Rules from '@/pages/Rules';
import AICommandCenter from '@/pages/AICommandCenter';
import PspCenter from '@/pages/PspCenter';
import PaymentLinks from '@/pages/PaymentLinks';
import Communication from '@/pages/Communication';
import Tasks from '@/pages/Tasks';
import RevenueAnalytics from '@/pages/RevenueAnalytics';
import InternalMessaging from '@/pages/InternalMessaging';
import TaskManagement from '@/pages/TaskManagement';
import AutomationEngine from '@/pages/AutomationEngine';
import GlobalSettings from '@/pages/GlobalSettings';
import DatabaseInspector from '@/pages/DatabaseInspector';
import HealthMonitor from '@/pages/HealthMonitor';
import InfrastructureMap from '@/pages/InfrastructureMap';
import DeploymentPipeline from '@/pages/DeploymentPipeline';
import EnvironmentConfig from '@/pages/EnvironmentConfig';
import FinancialIntegrations from '@/pages/FinancialIntegrations';
import AlertRules from '@/pages/AlertRules';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Overview />} />
          <Route path="/ai" element={<AICommandCenter />} />
          <Route path="/payments" element={<PspCenter />} />
          <Route path="/payment-links" element={<PaymentLinks />} />
          <Route path="/communication" element={<Communication />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/apps" element={<Applications />} />
          <Route path="/apps/new" element={<CreateApplication />} />
          <Route path="/apps/:slug" element={<ApplicationDetail />} />
          <Route path="/apps/:slug/:tab" element={<ApplicationDetail />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/environments" element={<Environments />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/audit" element={<AuditLogs />} />
          <Route path="/administrators" element={<Administrators />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/api-logs" element={<ApiLogs />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/security" element={<Security />} />
          <Route path="/users" element={<Users />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/revenue" element={<Revenue />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/revenue-analytics" element={<RevenueAnalytics />} />
          <Route path="/internal-messaging" element={<InternalMessaging />} />
          <Route path="/task-management" element={<TaskManagement />} />
          <Route path="/automation-engine" element={<AutomationEngine />} />
          <Route path="/global-settings" element={<GlobalSettings />} />
          <Route path="/database-inspector" element={<DatabaseInspector />} />
          <Route path="/health-monitor" element={<HealthMonitor />} />
          <Route path="/infrastructure-map" element={<InfrastructureMap />} />
          <Route path="/deployments" element={<DeploymentPipeline />} />
          <Route path="/environment-config" element={<EnvironmentConfig />} />
          <Route path="/financial-integrations" element={<FinancialIntegrations />} />
          <Route path="/alert-rules" element={<AlertRules />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <I18nProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </I18nProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App