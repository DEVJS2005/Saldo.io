import { Skeleton } from '../components/ui/Skeleton';

// ... imports ...

export default function Dashboard() {
  const { selectedDate, setSelectedDate } = useDate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [closeMonthOpen, setCloseMonthOpen] = useState(false);
  const { income, expense, balanceProjected, balanceReal, transactions, accountBalances, loading } = useBudget(selectedDate); // Get loading

  // ...

  return (
    <div className="space-y-6">
      {/* ... Header ... */}

      {loading ? (
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
      )}

      {loading ? (
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
      )}

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
