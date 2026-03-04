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
import { Skeleton } from '../components/ui/Skeleton';
import { useTranslation } from 'react-i18next';

export default function Transactions() {
  const { t } = useTranslation();
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

  const { transactions, refresh, loading } = useBudget(selectedDate);
  const { deleteTransaction, updateTransaction } = useTransactions();

  // Fetch Master Data
  const { categories, accounts } = useMasterData();

  const getCategoryName = (id) => categories?.find(c => c.id === id)?.name || '...'; // id is uuid now, might not match if loading
  const getAccountName = (id) => accounts?.find(a => a.id === id)?.name || '...';

  // Filter Logic
  const filteredTransactions = transactions?.filter(tx => {
    const matchAccount = filterAccount
      ? (filterAccountMode === 'include' ? tx.accountId === filterAccount : tx.accountId !== filterAccount)
      : true;
    const matchCategory = filterCategory ? tx.categoryId === filterCategory : true;
    const matchType = filterType !== 'all' ? tx.type === filterType : true;
    const matchStatus = filterStatus ? tx.paymentStatus === filterStatus : true;

    return matchAccount && matchCategory && matchType && matchStatus;
  }).sort((a, b) => {
    if (sortOrder === 'amount-desc') return Number(b.amount) - Number(a.amount);
    if (sortOrder === 'amount-asc') return Number(a.amount) - Number(b.amount);
    if (sortOrder === 'date-asc') return new Date(a.date) - new Date(b.date);
    // Default date-desc
    return new Date(b.date) - new Date(a.date);
  }) || [];

  // Total Calculation
  const filteredTotal = filteredTransactions.reduce((acc, tx) => {
    // If filtering by type, we might want to just sum absolute values or keep net?
    // User expectation: If filtering 'receita', total is sum of revenues.
    // If filtering 'despesa', total is sum of expenses (maybe negative?).
    // Current logic: Revenue (+), Expense (-).
    return tx.type === 'receita' ? acc + Number(tx.amount) : acc - Number(tx.amount);
  }, 0);

  /* Actions */
  const handleEdit = (tx) => {
    setTransactionToEdit(tx);
    setEditModalOpen(true);
  };

  const handleDeleteClick = async (tx) => {
    if (tx.recurrenceId || tx.installmentId) {
      setTransactionToDelete(tx);
      setDeleteModalOpen(true);
    } else {
      if (window.confirm(t('transactions.confirm_delete_simple', 'Tem certeza que deseja excluir esta transação?'))) {
        await deleteTransaction(tx.id);
        refresh();
        // Force reload just in case Realtime is disabled or slow
        window.location.reload();
      }
    }
  };

  const confirmDelete = async (mode) => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete.id, mode);
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
      refresh();
      window.location.reload();
    }
  };

  const handleToggleStatus = async (tx, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const newStatus = tx.paymentStatus === 'paid' ? 'pending' : 'paid';
      await updateTransaction(tx.id, { paymentStatus: newStatus }, 'single');
      refresh();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('transactions.title', 'Transações')}</h1>
          <p className="text-[var(--text-secondary)]">{t('transactions.overview', 'Gerencie suas receitas e despesas')}</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar w-full sm:w-auto">
          <MonthYearSelector selectedDate={selectedDate} onChange={setSelectedDate} />
          <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2 whitespace-nowrap flex-shrink-0" data-testid="btn-add-transaction">
            <Plus size={18} />
            <span className="hidden sm:inline">{t('transactions.new_transaction', 'Nova Transação')}</span>
            <span className="sm:hidden">{t('common.new', 'Nova')}</span>
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
              <option value="all">{t('transactions.filter_all', 'Todas as Transações')}</option>
              <option value="receita">{t('transactions.filter_incomes', 'Apenas Receitas')}</option>
              <option value="despesa">{t('transactions.filter_expenses', 'Apenas Despesas')}</option>
            </select>
          </div>
          <div className="min-w-[150px] flex-1 flex gap-1">
            <button
              onClick={() => setFilterAccountMode(prev => prev === 'include' ? 'exclude' : 'include')}
              className={`px-2 rounded-lg border transition-colors ${filterAccountMode === 'exclude'
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)]'}`}
              title={filterAccountMode === 'exclude' ? t('transactions.excluding_selected', 'Excluindo conta selecionada') : t('transactions.only_selected_account', 'Filtrando apenas conta selecionada')}
            >
              {filterAccountMode === 'exclude' ? t('transactions.except', 'Exceto') : t('transactions.only', 'Apenas')}
            </button>
            <select
              className={`w-full bg-[var(--bg-card)] border rounded-lg px-3 py-2 text-sm outline-none ${filterAccountMode === 'exclude' ? 'border-red-500/30' : 'border-[var(--border-color)] focus:border-[var(--primary)]'}`}
              value={filterAccount}
              onChange={e => setFilterAccount(e.target.value)}
            >
              <option value="">{t('transactions.all_accounts', 'Todas as Contas')}</option>
              {accounts?.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
          <div className="min-w-[150px] flex-1">
            <select
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">{t('transactions.all_categories', 'Todas as Categorias')}</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="min-w-[150px] flex-1">
            <select
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">{t('transactions.all_statuses', 'Todos os Status')}</option>
              <option value="paid">{t('transactions.paid_received', 'Pago / Recebido')}</option>
              <option value="pending">{t('transactions.pending', 'Pendente')}</option>
            </select>
          </div>
          <div className="min-w-[150px] flex-1">
            <select
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="date-desc">{t('transactions.date_newest', 'Data (Mais recente)')}</option>
              <option value="date-asc">{t('transactions.date_oldest', 'Data (Mais antiga)')}</option>
              <option value="amount-desc">{t('transactions.amount_high_low', 'Valor (Maior para menor)')}</option>
              <option value="amount-asc">{t('transactions.amount_low_high', 'Valor (Menor para maior)')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between p-2 border-b border-[var(--border-color)] last:border-0">
                <div className="space-y-2 w-1/3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="w-1/4">
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="w-1/5">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="w-1/5 text-right">
                  <Skeleton className="h-4 w-full ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-secondary)]">
            {t('transactions.no_transactions', 'Nenhuma transação encontrada.')}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-input)]/30">
                    <th className="p-4 font-medium text-[var(--text-secondary)]">{t('transactions.col_date', 'Data')}</th>
                    <th className="p-4 font-medium text-[var(--text-secondary)]">{t('transactions.col_description', 'Descrição')}</th>
                    <th className="p-4 font-medium text-[var(--text-secondary)]">{t('transactions.col_category', 'Categoria')}</th>
                    <th className="p-4 font-medium text-[var(--text-secondary)]">{t('transactions.col_account', 'Conta')}</th>
                    <th className="p-4 font-medium text-[var(--text-secondary)]">{t('transactions.col_status', 'Status')}</th>
                    <th className="p-4 font-medium text-[var(--text-secondary)] text-right">{t('transactions.col_amount', 'Valor')}</th>
                    <th className="p-4 font-medium text-[var(--text-secondary)] text-center">{t('transactions.col_actions', 'Ações')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]" data-testid="transaction-list">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="last:border-0 hover:bg-[var(--bg-input)]/20 transition-colors" data-testid={`transaction-item-${tx.id}`}>
                      <td className="p-4 text-sm whitespace-nowrap">{format(new Date(tx.date), 'dd/MM/yyyy')}</td>
                      <td className="p-4">
                        <div className="font-medium">{tx.description}</div>
                        {tx.totalInstallments > 1 && (
                          <div className="text-xs text-[var(--text-secondary)] inline-flex items-center gap-1 bg-[var(--bg-input)] px-1.5 py-0.5 rounded mt-1">
                            {t('transactions.installment_abbr', 'Parcela')} {tx.installmentNumber}/{tx.totalInstallments}
                          </div>
                        )}
                        {tx.isRecurring && (
                          <div className="text-xs text-blue-400 inline-flex items-center gap-1 bg-blue-400/10 px-1.5 py-0.5 rounded mt-1 ml-2">
                            {t('transactions.recurring', 'Recorrente')}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm whitespace-nowrap opacity-80">{getCategoryName(tx.categoryId)}</td>
                      <td className="p-4 text-sm whitespace-nowrap opacity-80">{getAccountName(tx.accountId)}</td>
                      <td className="p-4 text-sm whitespace-nowrap">
                        <button
                          onClick={(e) => handleToggleStatus(tx, e)}
                          className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors active:scale-95 select-none ${tx.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                            }`}
                          title={tx.paymentStatus === 'paid' ? t('transactions.mark_pending', 'Marcar como Pendente') : t('transactions.mark_paid', 'Marcar como Pago')}
                        >
                          {tx.paymentStatus === 'paid' ? t('transactions.paid_abbr', 'Pago') : t('transactions.pending', 'Pendente')}
                        </button>
                      </td>
                      <td className="p-4 text-right font-medium whitespace-nowrap">
                        <span className={tx.type === 'receita' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                          {tx.type === 'receita' ? '+' : '-'} {formatMoney(tx.amount)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setTransactionToView(tx); setViewModalOpen(true); }}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-2"
                            title={t('common.view', 'Visualizar')}
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(tx)}
                            className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-2"
                            title={t('common.edit', 'Editar')}
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(tx)}
                            className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors p-2"
                            title={t('common.delete', 'Excluir')}
                            data-testid={`btn-delete-transaction-${tx.id}`}
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
                    <td colSpan={4} className="p-4 text-right text-[var(--text-secondary)]">{t('transactions.filtered_total', 'Total Filtrado:')}</td>
                    <td className={`p-4 text-right text-lg ${filteredTotal >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--danger)]'}`}>
                      {formatMoney(filteredTotal)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-[var(--border-color)]" data-testid="transaction-list-mobile">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 space-y-3 hover:bg-[var(--bg-input)]/20 transition-colors" data-testid={`transaction-item-mobile-${tx.id}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-[var(--text-primary)]">{tx.description}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {format(new Date(tx.date), 'dd/MM/yyyy')} • {getCategoryName(tx.categoryId)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${tx.type === 'receita' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {tx.type === 'receita' ? '+' : '-'} {formatMoney(tx.amount)}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {getAccountName(tx.accountId)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleToggleStatus(tx, e)}
                        className={`px-2 py-0.5 rounded-full font-medium border transition-colors cursor-pointer active:scale-95 select-none ${tx.paymentStatus === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                        title={tx.paymentStatus === 'paid' ? t('transactions.mark_pending', 'Marcar como Pendente') : t('transactions.mark_paid', 'Marcar como Pago')}
                      >
                        {tx.paymentStatus === 'paid' ? t('transactions.paid_abbr', 'Pago') : t('transactions.pending', 'Pendente')}
                      </button>
                      {tx.totalInstallments > 1 && (
                        <span className="bg-[var(--bg-input)] border border-[var(--border-color)] px-2 py-0.5 rounded text-[var(--text-secondary)]">
                          {tx.installmentNumber}/{tx.totalInstallments}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(tx)}
                        className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                        title={t('common.edit', 'Editar')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(tx)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                        title={t('common.delete', 'Excluir')}
                        data-testid={`btn-delete-transaction-mobile-${tx.id}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-input)]/10 flex justify-between items-center font-medium">
                <span className="text-[var(--text-secondary)]">{t('transactions.filtered_total', 'Total Filtrado:')}</span>
                <span className={`${filteredTotal >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--danger)]'}`}>
                  {formatMoney(filteredTotal)}
                </span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('transactions.new_transaction', 'Nova Transação')}
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
        title={t('transactions.edit_transaction', 'Editar Transação')}
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
        title={t('transactions.details', 'Detalhes da Transação')}
      >
        {transactionToView && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)]">{t('transactions.col_description', 'Descrição')}</label>
              <div className="text-lg font-medium">{transactionToView.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)]">{t('transactions.col_amount', 'Valor')}</label>
                <div className={`text-lg font-medium ${transactionToView.type === 'receita' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {formatMoney(transactionToView.amount)}
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)]">{t('transactions.col_date', 'Data')}</label>
                <div>{format(new Date(transactionToView.date), 'dd/MM/yyyy')}</div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)]">{t('transactions.col_category', 'Categoria')}</label>
                <div>{getCategoryName(transactionToView.categoryId)}</div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)]">{t('transactions.col_account', 'Conta')}</label>
                <div>{getAccountName(transactionToView.accountId)}</div>
              </div>
            </div>
            {transactionToView.totalInstallments > 1 && (
              <div className="mt-2 text-sm bg-[var(--bg-input)] p-2 rounded">
                {t('transactions.installment_abbr', 'Parcela')} {transactionToView.installmentNumber} {t('transactions.of', 'de')} {transactionToView.totalInstallments}
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button variant="ghost" onClick={() => setViewModalOpen(false)}>{t('common.cancel', 'Fechar')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={t('transactions.delete_transaction', 'Excluir Transação')}>
        <div className="space-y-4">
          <p>{t('transactions.delete_recurring_prompt', 'Esta é uma transação recorrente ou parcelada. Como deseja excluir?')}</p>
          <div className="flex flex-col gap-2">
            {transactionToDelete && (transactionToDelete.recurrenceId || transactionToDelete.installmentId) && (
              <>
                <Button variant="secondary" onClick={() => confirmDelete('single')} data-testid="btn-confirm-delete-single">
                  {t('transactions.delete_only_this', 'Apenas esta')} {transactionToDelete.installmentId ? t('transactions.installment_word', 'parcela') : t('transactions.transaction_word', 'transação')}
                </Button>
                <Button variant="secondary" onClick={() => confirmDelete('future')} data-testid="btn-confirm-delete-future">
                  {t('transactions.delete_this_and_future', 'Esta e as futuras')}
                </Button>
                <Button variant="danger" onClick={() => confirmDelete('all')} data-testid="btn-confirm-delete">
                  {t('transactions.delete_all_occurrences', 'Todas as')} {transactionToDelete.installmentId ? t('transactions.installments_word', 'parcelas') : t('transactions.occurrences_word', 'ocorrências')}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
