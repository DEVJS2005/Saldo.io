import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DateProvider } from './contexts/DateContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DialogProvider } from './contexts/DialogContext';
import { Suspense, lazy, useState, useEffect } from 'react';
import Loading from './components/ui/Loading';
import ErrorBoundary from './components/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

import { useTranslation } from 'react-i18next';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="flex items-center justify-center h-screen">{t('common.loading', 'Carregando...')}</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <div className="flex items-center justify-center h-screen">{t('common.loading', 'Carregando...')}</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

import { supabase } from './lib/supabase';
import { AlertTriangle, Wrench, LogOut } from 'lucide-react';

function MaintenanceScreen({ message }) {
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-[var(--primary)]/5">
        <Wrench size={48} className="text-[var(--primary)] animate-pulse" />
      </div>
      <h1 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">Modo Manutenção</h1>
      <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-8 text-lg">
        {message || "O sistema está passando por melhorias no momento. Voltaremos em breve!"}
      </p>

      {user ? (
        <div className="flex flex-col items-center gap-4 mt-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Você está logado(a) no momento (permissão insuficiente).
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all text-sm font-medium text-red-500"
          >
            <LogOut size={16} />
            Sair e trocar de conta
          </button>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex items-start gap-3 text-left max-w-sm w-full mx-auto shadow-sm">
            <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--text-secondary)]">
              Se você é um administrador, faça login para obter acesso interno à plataforma durante a manutenção.
            </div>
          </div>
          <a href="/login" className="text-[var(--primary)] hover:underline text-sm font-medium">Acesso Restrito (Admin)</a>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [maintenance, setMaintenance] = useState({ active: false, message: '' });
  const [isCheckingMaintenance, setIsCheckingMaintenance] = useState(true);

  useEffect(() => {
    // 1. Fetch initial state
    const fetchMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('id', 'maintenance_mode')
          .single();

        if (data && data.value) {
          setMaintenance(data.value);
        }
      } catch (err) {
        console.error("Error fetching maintenance status:", err);
      } finally {
        setIsCheckingMaintenance(false);
      }
    };

    fetchMaintenance();

    // 2. Listen for real-time changes
    const channel = supabase
      .channel('public:app_settings')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_settings',
        filter: "id=eq.maintenance_mode"
      }, (payload) => {
        if (payload.new && payload.new.value) {
          setMaintenance(payload.new.value);
        }
      })
      .subscribe();

    // 3. Listen for Password Recovery events (redirects from email links)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // React Router's navigate isn't available outside Router, so we force redirect
          // The route /reset-password will pick it up
          window.location.href = '/reset-password';
        }
      }
    );

    return () => {
      supabase.removeChannel(channel);
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading || isCheckingMaintenance) {
    return <Loading />;
  }

  // Intercept routing if maintenance is ON and user is NOT an admin
  // We STILL ALLOW access to /login so admins can authenticate themselves
  const isLoginPage = window.location.pathname === '/login';

  if (maintenance?.active && user?.role !== 'admin' && !isLoginPage) {
    return <MaintenanceScreen message={maintenance.message} />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={
        <Suspense fallback={<Loading />}>
          <ResetPassword />
        </Suspense>
      } />

      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/admin" element={
                  <ProtectedAdminRoute>
                    <Admin />
                  </ProtectedAdminRoute>
                } />
              </Routes>
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}



function App() {
  return (
    <AuthProvider>
      <DateProvider>
        <DialogProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
            <Analytics />
          </ErrorBoundary>
        </DialogProvider>
      </DateProvider>
    </AuthProvider>
  );
}

export default App;
