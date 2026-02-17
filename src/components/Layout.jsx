import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Settings, Wallet } from 'lucide-react';
import { clsx } from 'clsx';

const NavItem = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={clsx(
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
      active
        ? 'bg-[var(--primary)] text-white shadow-lg shadow-violet-500/20'
        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]'
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export const Layout = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Sidebar - Desktop */}
      <aside className="w-64 hidden md:flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-card)] p-4 fixed h-full">
        <div className="flex items-center gap-3 px-4 py-6 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <Wallet className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Saldo.io
          </h1>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={path === '/'} />
          <NavItem to="/transactions" icon={Receipt} label="Transações" active={path === '/transactions'} />
          <NavItem to="/reports" icon={PieChart} label="Relatórios" active={path === '/reports'} />
        </nav>

        <div className="mt-auto pt-6 border-t border-[var(--border-color)]">
          <NavItem to="/settings" icon={Settings} label="Configurações" active={path === '/settings'} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}

          <footer className="py-6 text-center text-sm text-[var(--text-secondary)] border-t border-[var(--border-color)] mt-8">
            <p>© {new Date().getFullYear()} Saldo.io. All rights reserved.</p>
            <p className="mt-1 text-xs opacity-70">
              Made by <span className="font-semibold text-[var(--primary)]">JS Dev</span> AND <span className="font-semibold text-[var(--primary)]">Gemini</span>
            </p>
          </footer>
        </div>
      </main>

      {/* Mobile Nav - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] p-2 flex justify-around z-50 pb-safe">
        <NavItem to="/" icon={LayoutDashboard} label="" active={path === '/'} />
        <NavItem to="/transactions" icon={Receipt} label="" active={path === '/transactions'} />
        <NavItem to="/reports" icon={PieChart} label="" active={path === '/reports'} />
        <NavItem to="/settings" icon={Settings} label="" active={path === '/settings'} />
      </nav>
    </div>
  );
};
