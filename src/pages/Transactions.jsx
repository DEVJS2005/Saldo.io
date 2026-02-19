import { Skeleton } from '../components/ui/Skeleton';

// ... imports ...

export default function Transactions() {
  // ... hooks ...
  const { transactions, refresh, loading } = useBudget(selectedDate); // Get loading

  // ...

  return (
    <div className="space-y-6">
      {/* ... Header ... */}

      <Card className="p-0 overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-[var(--border-color)] bg-[var(--bg-input)]/20 overflow-x-auto">
          {/* ... filters content ... */}
          {/* (Keeping filters visible even during load is fine, or disable them) */}
          {/* For simplicity, we just keep them interactive or maybe disabled? Let's keep them functional. */}
          <div className="min-w-[150px] flex-1">
            <select
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              disabled={loading}
            >
              <option value="all">Todas as Transações</option>
              {/* ... */}
            </select>
          </div>
          {/* ... other filters ... */}
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
            Nenhuma transação encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* ... Table ... */}
            <table className="w-full text-left border-collapse min-w-[600px]">
              {/* ... table content ... */}
            </table>
          </div>
        )}
      </Card>
      {/* ... Modals ... */}



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
    </div >
  );
}
