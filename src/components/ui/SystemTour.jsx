import { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useTranslation } from 'react-i18next';

export const SystemTour = () => {
    const { t } = useTranslation();
    const [run, setRun] = useState(false);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        if (!hasSeenTour) {
            // Small delay to let the UI render completely
            setTimeout(() => setRun(true), 1500);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem('hasSeenTour', 'true');
        }
    };

    const steps = [
        {
            target: 'body',
            placement: 'center',
            content: (
                <div className="text-left">
                    <h3 className="text-xl font-bold mb-2 text-[var(--primary)]">{t('tour.welcome_title', 'Bem-vindo ao Saldo.io!')}</h3>
                    <p className="text-[var(--text-secondary)]">{t('tour.welcome_desc', 'Fizemos este tour rápido para te mostrar os principais recursos do sistema. Vamos lá?')}</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '.tour-nav',
            content: t('tour.nav_desc', 'Use este menu lateral para navegar entre o Dashboard, Transações, Relatórios e Configurações.'),
            placement: 'right',
        },
        {
            target: '.tour-settings',
            content: t('tour.settings_desc', 'Aqui você pode alterar rapidamente o idioma e alternar entre os temas Claro e Escuro.'),
            placement: 'bottom-end',
        },
        {
            target: '.tour-balance',
            content: t('tour.balance_desc', 'Seu Saldo Total e as projeções para o final do mês ficam sempre visíveis no topo do painel.'),
            placement: 'bottom',
        },
        {
            target: '.tour-new-transaction',
            content: t('tour.new_transaction_desc', 'Clique aqui para adicionar novas Receitas ou Despesas, inclusive fixas e parceladas!'),
            placement: 'left',
        },
        {
            target: '.tour-charts',
            content: t('tour.charts_desc', 'Acompanhe seus gastos por categoria e fluxo diário através de gráficos interativos e detalhados.'),
            placement: 'top',
        }
    ];

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous={true}
            scrollToFirstStep={true}
            showProgress={true}
            showSkipButton={true}
            locale={{
                back: t('common.back', 'Voltar'),
                close: t('common.close', 'Fechar'),
                last: t('common.finish', 'Concluir'),
                next: t('common.next', 'Próximo'),
                skip: t('common.skip', 'Pular')
            }}
            styles={{
                options: {
                    arrowColor: 'var(--bg-card)',
                    backgroundColor: 'var(--bg-card)',
                    overlayColor: 'rgba(0, 0, 0, 0.6)',
                    primaryColor: 'var(--primary)',
                    textColor: 'var(--text-primary)',
                    zIndex: 1000,
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    backgroundColor: 'var(--primary)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                },
                buttonBack: {
                    color: 'var(--text-secondary)',
                    marginRight: '10px'
                },
                buttonSkip: {
                    color: 'var(--text-secondary)'
                }
            }}
            callback={handleJoyrideCallback}
        />
    );
};
