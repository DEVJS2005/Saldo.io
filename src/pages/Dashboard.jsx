import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { useBudget } from '../hooks/useBudget';
import { Charts } from '../components/dashboard/Charts';
import { AccountsList } from '../components/dashboard/AccountsList';
import { MonthYearSelector } from '../components/ui/MonthYearSelector';
import { CloseMonthModal } from '../components/dashboard/CloseMonthModal';
import { useDate } from '../contexts/DateContext';
import { ChartPie, WalletMinimal } from 'lucide-react'; // Example icons

export default function Dashboard() {
  const { selectedDate, setSelectedDate } = useDate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closeMonthOpen, setCloseMonthOpen] = useState(false);
  const { income, expense, balanceProjected, balanceReal, transactions, accountBalances } = useBudget(selectedDate);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-[var(--text-secondary)]">Visão geral das suas finanças</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <MonthYearSelector selectedDate={selectedDate} onChange={setSelectedDate} />

          <div className="flex gap-2">
            {/* Verify if any account has balance before showing Close Month */}
            {Object.values(accountBalances || {}).some(bal => Math.abs(bal) > 0.01) && (
              <Button onClick={() => setCloseMonthOpen(true)} size="sm" variant="secondary" title="Zerar Saldo Real">
                <WalletMinimal size={18} className="mr-1" />
                Fechar Mês
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)} size="sm">
              <Plus size={18} className="mr-1" />
              Nova
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Previsão (Fim do Mês)">
          <div className={`text-3xl font-bold ${balanceProjected >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--danger)]'}`}>
            {formatCurrency(balanceProjected)}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Considerando pendências do mês</p>
        </Card>

        <Card title="Saldo Atual">
          <div className={`text-3xl font-bold ${balanceReal >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {formatCurrency(balanceReal)}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Dinheiro em caixa</p>
        </Card>

        <Card title="Receitas">
          <div className="text-2xl font-semibold text-[var(--primary)]">{formatCurrency(income)}</div>
        </Card>
        <Card title="Despesas">
          <div className="text-2xl font-semibold text-[var(--danger)]">{formatCurrency(expense)}</div>
        </Card>
      </div>

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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Transação"
      >
        <TransactionForm
          onClose={() => setIsModalOpen(false)}
          defaultDate={selectedDate}
          onSuccess={useBudget(selectedDate).refresh}
        />
      </Modal>

      <Modal
        isOpen={closeMonthOpen}
        onClose={() => setCloseMonthOpen(false)}
        title="Fechar Mês / Zerar Saldo"
      >
        <CloseMonthModal onClose={() => setCloseMonthOpen(false)} selectedDate={selectedDate} />
      </Modal>
    </div>
  );
}
