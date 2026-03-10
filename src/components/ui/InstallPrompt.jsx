import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Button } from './Button';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export function InstallPrompt({ variant = 'floating' }) {
    const { isInstallable, isInstalled, promptInstall, dismissInstall } = usePWAInstall();
    const { t } = useTranslation();
    const [show, setShow] = useState(false);

    // Add a tiny delay so it slides in nicely
    useEffect(() => {
        if (isInstallable) {
            const timer = setTimeout(() => setShow(true), 1500);
            return () => clearTimeout(timer);
        } else {
            setShow(false);
        }
    }, [isInstallable]);

    if (!isInstallable || isInstalled || !show) {
        return null;
    }

    if (variant === 'card') {
        // Used inside the Login page, static card
        return (
            <div className="mt-6 p-4 rounded-xl border border-[var(--primary)]/30 bg-gradient-to-r from-[var(--primary)]/10 to-[var(--bg-card)] shadow-md animate-in fade-in slide-in-from-bottom-4 relative">
                <button 
                    onClick={dismissInstall}
                    className="absolute top-2 right-2 p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <X size={14} />
                </button>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-[var(--bg-body)] rounded-2xl flex items-center justify-center shadow-inner mb-3 border border-[var(--border-color)]">
                        <Download className="text-[var(--primary)]" size={20} />
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)] mb-1">{t('pwa.install_title', 'Instalar Aplicativo')}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4 px-2">
                        {t('pwa.install_desc', 'Adicione o Saldo.io à sua tela inicial para acesso rápido e modo offline.')}
                    </p>
                    <div className="flex w-full gap-2">
                        <Button onClick={dismissInstall} variant="secondary" className="flex-1 py-2 text-sm">
                            {t('pwa.not_now', 'Agora Não')}
                        </Button>
                        <Button onClick={promptInstall} variant="primary" className="flex-[2] py-2 text-sm shadow-md shadow-[var(--primary)]/20">
                            {t('pwa.install_btn', 'Instalar App')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Floating variant for authenticated mobile users
    return (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:w-96 p-4 rounded-2xl border border-[var(--primary)]/30 bg-[var(--bg-card)]/95 backdrop-blur-xl shadow-2xl z-50 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <button 
                onClick={dismissInstall}
                className="absolute top-3 right-3 p-1.5 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Dispensar"
            >
                <X size={16} />
            </button>
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 text-white">
                    <span className="text-xl font-bold">S</span>
                </div>
                <div className="flex-1 pt-0.5">
                    <h4 className="font-bold text-[var(--text-primary)] text-sm mb-0.5">{t('pwa.install_title', 'Instalar Aplicativo')}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mb-3 leading-snug">
                        {t('pwa.install_desc', 'Adicione o Saldo.io à sua tela inicial para acesso rápido e modo offline.')}
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={dismissInstall} variant="ghost" className="px-3 py-1.5 h-auto text-xs font-medium">
                            {t('pwa.not_now', 'Agora Não')}
                        </Button>
                        <Button onClick={promptInstall} variant="primary" className="px-4 py-1.5 h-auto text-xs font-bold w-full">
                            {t('pwa.install_btn', 'Instalar App')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
