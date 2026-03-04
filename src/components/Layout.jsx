import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Settings, Wallet, LogOut, ShieldCheck, DownloadCloud, Bell, X, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { syncCloudToLocal } from '../lib/syncService';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const NavItem = ({ to, icon: Icon, label, active, onClick, testId }) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        data-testid={testId}
        className={clsx(
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left cursor-pointer relative z-10',
          active
            ? 'bg-[var(--primary)] text-white shadow-lg shadow-violet-500/20'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]'
        )}
      >
        <Icon size={20} />
        <span className="font-medium hidden md:inline">{label}</span>
      </button>
    );
  }
  return (
    <Link
      to={to}
      data-testid={testId}
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
        active
          ? 'bg-[var(--primary)] text-white shadow-lg shadow-violet-500/20'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]'
      )}
    >
      <Icon size={20} />
      <span className="font-medium hidden md:inline">{label}</span>
    </Link>
  );
};

export const Layout = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const path = location.pathname;
  const { signOut, user } = useAuth();
  const { alert, confirm } = useDialog();
  const [isMigrating, setIsMigrating] = useState(false);

  // Changelog State
  const [changelogs, setChangelogs] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    // 1. Check downgrade/local mode
    const checkDowngrade = async () => {
      if (!user) return;

      const hadCloudAccess = localStorage.getItem('has_cloud_access') === 'true';

      if (user.canSync) {
        if (!hadCloudAccess) localStorage.setItem('has_cloud_access', 'true');
      } else if (hadCloudAccess) {
        setIsMigrating(true);
        try {
          const result = await syncCloudToLocal(user.id);
          if (result.success) {
            localStorage.setItem('has_cloud_access', 'false');
            setIsMigrating(false); // Stop loading before alert
            await alert(
              t('layout.premium_expired_desc', 'Seu plano Premium expirou. Baixamos seus dados mais recentes da nuvem para este dispositivo. Você pode continuar usando o sistema em Modo Local.'),
              t('layout.local_mode_activated', 'Modo Local Ativado'),
              'info'
            );
          } else {
            setIsMigrating(false);
            console.error(result.error);
            await alert(t('layout.backup_failed', 'Falha ao baixar backup da nuvem. Entre em contato com o suporte.'), t('layout.error', 'Erro'), 'error');
          }
        } catch (e) {
          setIsMigrating(false);
          console.error(e);
        }
      }
    };

    checkDowngrade();

    // 2. Fetch Changelogs
    const fetchChangelogs = async () => {
      const { data, error } = await supabase
        .from('changelog')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && !error) {
        setChangelogs(data);
        // Simple unread logic based on local storage
        const lastSeen = localStorage.getItem('last_seen_changelog');
        if (data.length > 0 && (!lastSeen || new Date(data[0].created_at) > new Date(lastSeen))) {
          setHasUnread(true);
        }
      }
    };

    fetchChangelogs();

    // 3. Listen for new changelogs (Realtime)
    const channel = supabase
      .channel('public:changelog')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'changelog' },
        (payload) => {
          setChangelogs(prev => [payload.new, ...prev].slice(0, 10));
          setHasUnread(true);
        }
      )
      .subscribe();

    // Click outside to close notifications
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [user]);

  const toggleNotifications = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState && changelogs.length > 0) {
      setHasUnread(false);
      localStorage.setItem('last_seen_changelog', new Date().toISOString());
    }
  };

  const handleLogout = async () => {
    if (await confirm(t('layout.logout_confirm', 'Deseja realmente sair da sua conta?'), t('common.logout', 'Sair'))) {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      } finally {
        // Force redirect to ensure state clear, even if network fails
        window.location.href = '/login';
      }
    }
  };

  if (isMigrating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        <h2 className="text-xl font-bold animate-pulse">{t('layout.syncing_data', 'Sincronizando dados...')}</h2>
        <p className="text-[var(--text-secondary)]">{t('layout.downloading_backup', 'Baixando backup da nuvem para uso offline.')}</p>
      </div>
    );
  }

  const getChangelogIcon = (type) => {
    switch (type) {
      case 'feature': return <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />;
      case 'fix': return <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />;
      case 'maintenance': return <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />;
      default: return <Info className="text-gray-500 shrink-0 mt-0.5" size={16} />;
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">

      {/* Sidebar - Desktop */}
      <aside className="w-64 hidden md:flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-card)] p-4 fixed h-full z-50">
        <div className="flex items-center gap-3 px-4 py-6 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <Wallet className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Saldo.io
          </h1>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem to="/" icon={LayoutDashboard} label={t('sidebar.dashboard')} active={path === '/'} />
          <NavItem to="/transactions" icon={Receipt} label={t('sidebar.transactions')} active={path === '/transactions'} />
          <NavItem to="/reports" icon={PieChart} label={t('sidebar.reports')} active={path === '/reports'} />
          {user?.role === 'admin' && (
            <NavItem to="/admin" icon={ShieldCheck} label={t('sidebar.admin')} active={path === '/admin'} />
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-[var(--border-color)] space-y-2">
          <NavItem to="/settings" icon={Settings} label={t('sidebar.settings')} active={path === '/settings'} />
          <NavItem icon={LogOut} label={t('common.logout', 'Sair')} onClick={handleLogout} testId="btn-logout" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative overflow-x-hidden">

        {/* Top Header & Notifications */}
        <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-4 py-3 flex justify-between md:justify-end items-center h-16">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
              <Wallet className="text-white" size={16} />
            </div>
            <span className="font-bold text-lg">Saldo.io</span>
          </div>

          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotifications}
              className="p-2 rounded-full hover:bg-[var(--bg-input)] transition-colors relative focus:outline-none"
            >
              <Bell size={20} className="text-[var(--text-secondary)]" />
              {hasUnread && (
                <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--bg-primary)] animate-pulse"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto custom-scrollbar bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)]/90 backdrop-blur-sm">
                  <h3 className="font-semibold">{t('layout.updates', 'Atualizações')}</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <X size={16} />
                  </button>
                </div>

                <div className="divide-y divide-[var(--border-color)]">
                  {changelogs.length === 0 ? (
                    <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
                      {t('layout.no_updates', 'Nenhuma novidade por enquanto.')}
                    </div>
                  ) : (
                    changelogs.map(log => (
                      <div key={log.id} className="p-4 hover:bg-[var(--bg-input)]/30 transition-colors">
                        <div className="flex gap-3">
                          {getChangelogIcon(log.type)}
                          <div>
                            <h4 className="text-sm font-medium pr-2 text-[var(--text-primary)] mb-1 leading-tight">
                              {log.title}
                            </h4>
                            <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                              {log.content}
                            </p>
                            <div className="text-[10px] text-[var(--text-secondary)] opacity-70 mt-2">
                              {format(new Date(log.created_at), "dd MMM yyyy 'às' HH:mm")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}

          <footer className="py-6 text-center text-sm text-[var(--text-secondary)] border-t border-[var(--border-color)] mt-8">
            <p>© {new Date().getFullYear()} Saldo.io. {t('layout.all_rights_reserved', 'Todos os direitos reservados.')}</p>
            <p className="mt-1 text-xs opacity-70">
              {t('layout.made_by', 'Feito com ❤️ por')} <span className="font-semibold text-[var(--primary)]">JS Dev</span> & <span className="font-semibold text-[var(--primary)]">Gemini</span>
            </p>
          </footer>
        </div>
      </main>

      {/* Mobile Nav - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex justify-around z-50 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]">
        <NavItem to="/" icon={LayoutDashboard} label="" active={path === '/'} />
        <NavItem to="/transactions" icon={Receipt} label="" active={path === '/transactions'} />
        <NavItem to="/reports" icon={PieChart} label="" active={path === '/reports'} />
        {user?.role === 'admin' && (
          <NavItem to="/admin" icon={ShieldCheck} label="" active={path === '/admin'} />
        )}
        <NavItem to="/settings" icon={Settings} label="" active={path === '/settings'} />
      </nav>
    </div>
  );
};
