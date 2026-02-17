import { useState } from 'react';
import { useDate } from '../contexts/DateContext';
import { useMasterData } from '../hooks/useMasterData';
import { useBudget } from '../hooks/useBudget';
import { useTransactions } from '../hooks/useTransactions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Eye, Edit2, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { MonthYearSelector } from '../components/ui/MonthYearSelector';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { Modal } from '../components/ui/Modal';

export default function Transactions() {
  const { selectedDate, setSelectedDate } = useDate();
  const [filterType, setFilterType] = useState('all');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterAccountMode, setFilterAccountMode] = useState('include'); // 'include' or 'exclude'
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [transactionToView, setTransactionToView] = useState(null);

  const { transactions, refresh } = useBudget(selectedDate);
  const { deleteTransaction } = useTransactions();

  // Fetch Master Data
  const { categories, accounts } = useMasterData();

  const getCategoryName = (id) => categories?.find(c => c.id === id)?.name || '...'; // id is uuid now, might not match if loading
  const getAccountName = (id) => accounts?.find(a => a.id === id)?.name || '...';

  // Filter Logic
  const filteredTransactions = transactions?.filter(t => {
    const matchAccount = filterAccount
      ? (filterAccountMode === 'include' ? t.accountId === filterAccount : t.accountId !== filterAccount)
      : true;
    const matchCategory = filterCategory ? t.categoryId === filterCategory : true;
    const matchType = filterType !== 'all' ? t.type === filterType : true;
    const matchStatus = filterStatus ? t.paymentStatus === filterStatus : true;

    return matchAccount && matchCategory && matchType && matchStatus;
  }).sort((a, b) => {
    if (sortOrder === 'amount-desc') return Number(b.amount) - Number(a.amount);
    if (sortOrder === 'amount-asc') return Number(a.amount) - Number(b.amount);
    if (sortOrder === 'date-asc') return new Date(a.date) - new Date(b.date);
    // Default date-desc
    return new Date(b.date) - new Date(a.date);
  }) || [];

  // Total Calculation
  const filteredTotal = filteredTransactions.reduce((acc, t) => {
    // If filtering by type, we might want to just sum absolute values or keep net?
    // User expectation: If filtering 'receita', total is sum of revenues.
    // If filtering 'despesa', total is sum of expenses (maybe negative?).
    // Current logic: Revenue (+), Expense (-).
    return t.type === 'receita' ? acc + Number(t.amount) : acc - Number(t.amount);
  }, 0);

  /* Actions */
  const handleEdit = (t) => {
    setTransactionToEdit(t);
    setEditModalOpen(true);
  };

  const handleDeleteClick = async (t) => {
    if (t.recurrenceId || t.installmentId) {
      setTransactionToDelete(t);
      setDeleteModalOpen(true);
    } else {
      if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
        await deleteTransaction(t.id);
        refresh();
      }
    }
  };

  const confirmDelete = async (mode) => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete.id, mode);
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
      refresh();
    }
  };

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-[var(--text-secondary)]">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthYearSelector selectedDate={selectedDate} onChange={setSelectedDate} />
          <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
            <Plus size={18} />
            Nova Transação
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-[var(--border-color)] bg-[var(--bg-input)]/20 overflow-x-auto">
          <div className="min-w-[150px] flex-1">
            <select
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="all">Todas as Transações</option>
              <option value="receita">Apenas Receitas</option>
              <option value="despesa">Apenas Despesas</option>
            </select>
          </div>
          <div className="min-w-[150px] flex-1 flex gap-1">
            <button
              onClick={() => setFilterAccountMode(prev => prev === 'include' ? 'exclude' : 'include')}
              className={`px-2 rounded-lg border transition-colors ${filterAccountMode === 'exclude'
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)]'}`}
              title={filterAccountMode === 'exclude' ? 'Excluindo conta selecionada' : 'Filtrando apenas conta selecionada'}
            >
              {filterAccountMode === 'exclude' ? 'Exceto' : 'Apenas'}
            </button>
            <select
              className={`w-full bg-[var(--bg-card)] border rounded-lg px-3 py-2 text-sm outline-none ${filterAccountMode === 'exclude' ? 'border-red-500/30' : 'border-[var(--border-color)] focus:border-[var(--primary)]'}`}
              value={filterAccount}
              onChange={e => setFilterAccount(e.target.value)}
            >
              <option value="">Todas as Contas</option>
              {accounts?.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
          <div className="min-w-[150px] flex-1">
            <select
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">Todas as Categorias</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="min-w-[150px] flex-1">
            <select
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">Todos os Status</option>
              <option value="paid">Pago / Recebido</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
          <div className="min-w-[150px] flex-1">
            <select
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="date-desc">Data (Mais recente)</option>
              <option value="date-asc">Data (Mais antiga)</option>
              <option value="amount-desc">Valor (Maior para menor)</option>
              <option value="amount-asc">Valor (Menor para maior)</option>
            </select>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-secondary)]">
            Nenhuma transação encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-input)]/30">
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Data</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Descrição</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Categoria</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Conta</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Status</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)] text-right">Valor</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)] text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="last:border-0 hover:bg-[var(--bg-input)]/20 transition-colors">
                    <td className="p-4 text-sm whitespace-nowrap">{format(new Date(t.date), 'dd/MM/yyyy')}</td>
                    <td className="p-4">
                      <div className="font-medium">{t.description}</div>
                      {t.totalInstallments > 1 && (
                        <div className="text-xs text-[var(--text-secondary)] inline-flex items-center gap-1 bg-[var(--bg-input)] px-1.5 py-0.5 rounded mt-1">
                          Parcela {t.installmentNumber}/{t.totalInstallments}
                        </div>
                      )}
                      {t.isRecurring && (
                        <div className="text-xs text-blue-400 inline-flex items-center gap-1 bg-blue-400/10 px-1.5 py-0.5 rounded mt-1 ml-2">
                          Recorrente
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm whitespace-nowrap opacity-80">{getCategoryName(t.categoryId)}</td>
                    <td className="p-4 text-sm whitespace-nowrap opacity-80">{getAccountName(t.accountId)}</td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.paymentStatus === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-amber-500/10 text-amber-500'
                        }`}>
                        {t.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium whitespace-nowrap">
                      <span className={t.type === 'receita' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                        {t.type === 'receita' ? '+' : '-'} {formatMoney(t.amount)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setTransactionToView(t); setViewModalOpen(true); }}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2"
                          title="Visualizar"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(t)}
                          className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-2"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(t)}
                          className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors p-2"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[var(--bg-input)]/30 font-medium">
                <tr>
                  <td colSpan={4} className="p-4 text-right text-[var(--text-secondary)]">Total Filtrado:</td>
                  <td className={`p-4 text-right text-lg ${filteredTotal >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--danger)]'}`}>
                    {formatMoney(filteredTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Nova Transação"
      >
        <TransactionForm
          onClose={() => setCreateModalOpen(false)}
          defaultDate={selectedDate}
          onSuccess={refresh}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Editar Transação"
      >
        <TransactionForm
          onClose={() => setEditModalOpen(false)}
          transactionToEdit={transactionToEdit}
          defaultDate={selectedDate}
          onSuccess={refresh}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Detalhes da Transação"
      >
        {transactionToView && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)]">Descrição</label>
              <div className="text-lg font-medium">{transactionToView.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)]">Valor</label>
                <div className={`text-lg font-medium ${transactionToView.type === 'receita' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {formatMoney(transactionToView.amount)}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)]">Data</label>
                <div>{format(new Date(transactionToView.date), 'dd/MM/yyyy')}</div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)]">Categoria</label>
                <div>{getCategoryName(transactionToView.categoryId)}</div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)]">Conta</label>
                <div>{getAccountName(transactionToView.accountId)}</div>
              </div>
            </div>
            {transactionToView.totalInstallments > 1 && (
              <div className="mt-2 text-sm bg-[var(--bg-input)] p-2 rounded">
                Parcela {transactionToView.installmentNumber} de {transactionToView.totalInstallments}
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button variant="ghost" onClick={() => setViewModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Excluir Transação">
        <div className="space-y-4">
          <p>Esta é uma transação recorrente ou parcelada. Como deseja excluir?</p>
          <div className="flex flex-col gap-2">
            {transactionToDelete && (transactionToDelete.recurrenceId || transactionToDelete.installmentId) && (
              <>
                <Button variant="secondary" onClick={() => confirmDelete('single')}>
                  Apenas esta {transactionToDelete.installmentId ? 'parcela' : 'transação'}
                </Button>
                <Button variant="secondary" onClick={() => confirmDelete('future')}>
                  Esta e as futuras
                </Button>
                <Button variant="danger" onClick={() => confirmDelete('all')}>
                  Todas as {transactionToDelete.installmentId ? 'parcelas' : 'ocorrências'}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
