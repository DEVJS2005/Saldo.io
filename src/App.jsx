import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DateProvider } from './contexts/DateContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DialogProvider } from './contexts/DialogContext';
import { Suspense, lazy } from 'react';
import Loading from './components/ui/Loading';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Settings = lazy(() => import('./pages/Settings'));
const Reports = lazy(() => import('./pages/Reports'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
          </ErrorBoundary>
        </DialogProvider>
      </DateProvider>
    </AuthProvider>
  );
}

export default App;
