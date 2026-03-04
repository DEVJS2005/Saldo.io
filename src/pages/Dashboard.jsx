import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, WalletMinimal, CheckCircle } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { useBudget } from '../hooks/useBudget';
import { Charts } from '../components/dashboard/Charts';
import { AccountsList } from '../components/dashboard/AccountsList';
import { MonthYearSelector } from '../components/ui/MonthYearSelector';
import { CloseMonthModal } from '../components/dashboard/CloseMonthModal';
import { useDate } from '../contexts/DateContext';
import { Skeleton } from '../components/ui/Skeleton';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  const { selectedDate, setSelectedDate } = useDate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closeMonthOpen, setCloseMonthOpen] = useState(false);
  const { income, expense, balanceProjected, balanceReal, transactions, accountBalances, loading, refresh } = useBudget(selectedDate);
  const formatCurrency = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {t('dashboard.title', 'Dashboard')}
            <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold px-2 py-1 rounded-md border border-[var(--primary)]/20">BETA</span>
          </h1>
          <p className="text-[var(--text-secondary)]">{t('dashboard.overview', 'Visão geral das suas finanças')}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <MonthYearSelector selectedDate={selectedDate} onChange={setSelectedDate} />

          <div className="flex gap-2">
            {transactions.some(t => t.description.includes('Fechamento de Mês')) ? (
              <div className="flex items-center text-[var(--success)] bg-[var(--success)]/10 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--success)]/20">
                <CheckCircle size={16} className="mr-2" />
                Mês Fechado
              </div>
            ) : (
              <Button onClick={() => setCloseMonthOpen(true)} size="sm" variant="secondary" title="Zerar Saldo Real" className="flex items-center">
                <WalletMinimal size={18} className="mr-1" />
                Fechar Mês
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)} size="sm" data-testid="btn-add-transaction">
              <Plus size={18} className="mr-1" />
              {t('common.new', 'Nova')}
            </Button>
          </div>
        </div>
      </div>

      {
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card title={t('dashboard.forecast')}>
              <div className={`text-3xl font-bold ${balanceProjected >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--danger)]'}`}>
                {formatCurrency(balanceProjected)}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{t('dashboard.forecast_desc')}</p>
            </Card>

            <Card title={t('dashboard.total_balance')}>
              <div className={`text-3xl font-bold ${balanceReal >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`} data-testid="balance-display">
                {formatCurrency(balanceReal)}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{t('dashboard.cash_in_hand')}</p>
            </Card>

            <Card title={t('dashboard.incomes', 'Receitas')}>
              <div className="text-2xl font-semibold text-[var(--primary)]">{formatCurrency(income)}</div>
            </Card>
            <Card title={t('dashboard.expenses', 'Despesas')}>
              <div className="text-2xl font-semibold text-[var(--danger)]">{formatCurrency(expense)}</div>
            </Card>
          </div>
        )
      }

      {
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] h-[300px]">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
            <div>
              <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-color)] h-[300px] space-y-4">
                <Skeleton className="h-6 w-1/2 mb-4" />
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {income + expense > 0 && (
                <Charts transactions={transactions} />
              )}
            </div>
            <div>
              <div>
                <AccountsList transactions={transactions} globalBalances={accountBalances || {}} />
              </div>
            </div>
          </div>
        )
      }

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Transação"
      >
        <TransactionForm
          onClose={() => setIsModalOpen(false)}
          defaultDate={selectedDate}
          onSuccess={refresh}
        />
      </Modal>

      <Modal
        isOpen={closeMonthOpen}
        onClose={() => setCloseMonthOpen(false)}
        title="Fechar Mês / Zerar Saldo"
      >
        <CloseMonthModal onClose={() => setCloseMonthOpen(false)} selectedDate={selectedDate} />
      </Modal>
    </div >
  );
}
