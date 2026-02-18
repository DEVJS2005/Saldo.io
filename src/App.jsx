import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import { DateProvider } from './contexts/DateContext';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Admin from './pages/Admin';

// Clean App component
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DialogProvider } from './contexts/DialogContext';
import Login from './pages/Login';
import Register from './pages/Register';
import { Navigate } from 'react-router-dom';

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
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </DialogProvider>
      </DateProvider>
    </AuthProvider>
  );
}

export default App;
