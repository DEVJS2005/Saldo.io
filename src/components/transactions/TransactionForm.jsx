import { useState, useEffect } from 'react';
// Force Update HMR
import { useMasterData } from '../../hooks/useMasterData';
import { useTransactions } from '../../hooks/useTransactions';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const TransactionForm = ({ onClose, onSuccess, prefillType = 'despesa', defaultDate = new Date(), transactionToEdit = null }) => {
  const { addTransaction, updateTransaction } = useTransactions();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // ...
  });

  // Fetch Categories & Accounts
  const { categories: allCategories, accounts } = useMasterData();

  // Populate form if editing
  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        description: transactionToEdit.description,
        amount: transactionToEdit.amount.toString(),
        date: new Date(transactionToEdit.date).toISOString().split('T')[0],
        type: transactionToEdit.type,
        categoryId: transactionToEdit.categoryId,
        accountId: transactionToEdit.accountId,
        paymentStatus: transactionToEdit.paymentStatus,
        installments: transactionToEdit.totalInstallments || 1,
        currentInstallment: transactionToEdit.installmentNumber || 1,
        isRecurring: transactionToEdit.isRecurring || !!transactionToEdit.recurrenceId,
        // If editing a parcel, we are looking at the parcel value.
        // So "Is Installment Value" should be true.
        isInstallmentValue: (transactionToEdit.totalInstallments || 1) > 1,
      });
    } else {
      // Reset if switching to add mode (optional, but good for safety)
      setFormData(prev => ({
        description: '',
        amount: '',
        date: defaultDate.toISOString().split('T')[0],
        type: prefillType,
        categoryId: '',
        accountId: '',
        paymentStatus: '', // Reset to empty
        installments: 1,
        currentInstallment: 1,
        isRecurring: false,
        isInstallmentValue: false,
      }));
    }
  }, [transactionToEdit, defaultDate, prefillType]);

  // Reset category when type changes (only if not editing or if category doesn't match new type)
  useEffect(() => {
    if (!allCategories) return; // Wait for categories to load

    if (formData.categoryId) {
      const currentCategory = allCategories.find(c => c.id === formData.categoryId);
      // Only reset if we found the category AND it doesn't match the type
      // If we didn't find it (maybe deleted?), we might want to keep it or reset it. 
      // Safe bet: if found and mismatch, reset.
      if (currentCategory && currentCategory.type !== formData.type) {
        setFormData(prev => ({ ...prev, categoryId: '' }));
      }
    }
  }, [formData.type, formData.categoryId, allCategories]);


  // Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  const processSubmission = async (overrideMode = null) => {
    // If no pending submission, do nothing (shouldn't happen)
    // If overrideMode is provided, use it. Otherwise calculate automatic mode.
    const { event, formData, transactionToEdit } = pendingSubmission || {};

    // If not pending, it might be direct call? No, let's treat this as the worker.
    // Actually simpler: Logic in handleSubmit, calls Confirm if needed, then calls this.

    // Let's rewrite handleSubmit to be the orchestrator.
  };

  const handleConfirmPropagation = async (mode) => {
    if (!pendingSubmission) return;
    const { data, id } = pendingSubmission;

    try {
      await updateTransaction(id, data, mode);
      setConfirmModalOpen(false);
      setPendingSubmission(null);
      if (onSuccess) onSuccess();
      onClose();
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setIsLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let finalAmount = parseFloat(formData.amount);
      const finalStatus = formData.paymentStatus || 'pending';

      if (transactionToEdit) {
        // EDIT MODE
        if (formData.installments > 1 && formData.type === 'despesa') {
          if (formData.isInstallmentValue) {
            finalAmount = finalAmount;
          } else {
            finalAmount = finalAmount / formData.installments;
          }
        }

        const updateData = {
          ...formData,
          amount: finalAmount,
          paymentStatus: finalStatus,
          recurrenceId: formData.isRecurring ? transactionToEdit.recurrenceId : null,
          installmentId: transactionToEdit.installmentId,
          installmentNumber: transactionToEdit.installmentNumber // Ensure we pass the current number too if needed
        };

        // CHECK PROPAGATION LOGIC
        const isSeries = transactionToEdit.recurrenceId || transactionToEdit.installmentId;
        // Also consider if we are toggling recurrence ON/OFF for a transaction that WAS part of a series
        const wasRecurring = !!transactionToEdit.recurrenceId;
        const isNowRecurring = formData.isRecurring;
        const recurrenceChanged = wasRecurring !== isNowRecurring;

        if (isSeries || recurrenceChanged) {
          // Check if ANY significant field changed
          const amountChanged = Math.abs(finalAmount - transactionToEdit.amount) > 0.01;
          const categoryChanged = transactionToEdit.categoryId !== updateData.categoryId;
          const accountChanged = transactionToEdit.accountId !== updateData.accountId;
          const descChanged = transactionToEdit.description !== updateData.description;
          const typeChanged = transactionToEdit.type !== updateData.type;
          const dateChanged = transactionToEdit.date !== updateData.date; // simplified check
          const statusChanged = transactionToEdit.paymentStatus !== updateData.paymentStatus;

          if (amountChanged || categoryChanged || accountChanged || descChanged || typeChanged || dateChanged || statusChanged || recurrenceChanged) {
            // Store pending data and open modal for ANY change in a series
            setPendingSubmission({ id: transactionToEdit.id, data: updateData });
            setConfirmModalOpen(true);
            return; // Stop here, wait for user choice
          }
        }

        // Fallback: Normal single update (or no changes detected)
        await updateTransaction(transactionToEdit.id, updateData, 'single');

      } else {
        // CREATE MODE (Unchanged)
        if (formData.installments > 1 && formData.type === 'despesa') {
          if (formData.isInstallmentValue) {
            finalAmount = finalAmount * formData.installments;
          } else {
            finalAmount = finalAmount;
          }
        }

        await addTransaction({
          ...formData,
          amount: finalAmount,
          paymentStatus: finalStatus
        });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setError(err.message);
    } finally {
      // If we opened the modal, loading stays true in background, but that's fine.
      // If we didn't open modal, we finish here.
      if (!confirmModalOpen) setIsLoading(false);
    }
  };

  const categories = allCategories?.filter(c => c.type === formData.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div className="flex p-1 bg-[var(--bg-input)] rounded-xl mb-4">
        {['receita', 'despesa'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFormData({ ...formData, type: t })}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${formData.type === t
              ? 'bg-[var(--bg-card)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--text-secondary)]'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Input
        label="Descrição"
        placeholder={formData.type === 'receita' ? "Ex: Salário" : "Ex: Supermercado"}
        value={formData.description}
        onChange={e => setFormData({ ...formData, description: e.target.value })}
        required
        maxLength={100}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
            required
            max={999999999}
          />
          {formData.type === 'despesa' && formData.installments > 1 && (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="isInstallmentValue"
                checked={formData.isInstallmentValue}
                onChange={e => setFormData({ ...formData, isInstallmentValue: e.target.checked })}
                className="accent-[var(--primary)] w-3 h-3"
              />
              <label htmlFor="isInstallmentValue" className="text-xs text-[var(--text-secondary)]">Valor da Parcela?</label>
            </div>
          )}
        </div>
        <Input
          label="Data"
          type="date"
          value={formData.date}
          onChange={e => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Categoria"
          value={formData.categoryId}
          onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
          options={[
            { value: '', label: 'Selecione...' },
            ...(categories || []).map(c => ({ value: c.id, label: c.name }))
          ]}
          required
        />
        <Select
          label="Conta"
          value={formData.accountId}
          onChange={e => setFormData({ ...formData, accountId: e.target.value })}
          options={[
            { value: '', label: 'Selecione...' },
            ...(accounts || [])
              .filter(a => formData.type === 'receita' ? a.type !== 'credit' : true)
              .map(a => ({ value: a.id, label: a.name }))
          ]}
          required
        />
      </div>

      {/* Recurrence Options (Now for both Income and Expense) */}
      <div className="bg-[var(--bg-input)]/50 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRecurring"
            checked={formData.isRecurring}
            onChange={e => setFormData({ ...formData, isRecurring: e.target.checked, installments: 1, currentInstallment: 1 })}
            className="accent-[var(--primary)] w-4 h-4"
            disabled={formData.installments > 1}
          />
          <label htmlFor="isRecurring" className="text-sm">
            {formData.type === 'receita' ? 'Receita Fixa (Mensal)' : 'Despesa Fixa (Mensal)'}
          </label>
        </div>

        {formData.type === 'despesa' && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Total de Parcelas</label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.installments}
                onChange={e => setFormData({ ...formData, installments: Number(e.target.value), isRecurring: false })}
                disabled={formData.isRecurring}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-sm text-center"
              />
            </div>
            {formData.installments > 1 && (
              <div className="flex-1">
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Parcela Atual</label>
                <input
                  type="number"
                  min="1"
                  max={formData.installments}
                  value={formData.currentInstallment}
                  onChange={e => setFormData({ ...formData, currentInstallment: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2 py-1 text-sm text-center"
                />
              </div>
            )}
          </div>
        )}

        {formData.installments > 1 && (
          <p className="text-xs text-[var(--text-secondary)]">
            Gerando {formData.installments - formData.currentInstallment + 1} lançamentos: {formData.currentInstallment}/{formData.installments} até {formData.installments}/{formData.installments}.
          </p>
        )}
      </div>

      {/* Payment Status */}
      <div className="flex items-center gap-4 pt-2">
        <label className="text-sm font-medium">Status:</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, paymentStatus: 'paid' })}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${formData.paymentStatus === 'paid'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
          >
            Pago / Recebido
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, paymentStatus: 'pending' })}
            className={`px-3 py-1 rounded-lg text-xs font-medium border ${formData.paymentStatus === 'pending'
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
          >
            Pendente
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm bg-red-500/10 p-2 rounded-lg">{error}</p>}

      <div className="flex gap-3 pt-4">
        <Button variant="ghost" className="flex-1" onClick={onClose} type="button">Cancelar</Button>
        <Button className="flex-1" type="submit" isLoading={isLoading && !confirmModalOpen}>Salvar</Button>
      </div>

      {/* Confirmation Modal for Propagation */}
      {confirmModalOpen && (
        <Modal
          isOpen={confirmModalOpen}
          onClose={() => { setConfirmModalOpen(false); setIsLoading(false); setPendingSubmission(null); }}
          title="Alteração em Série"
        >
          <div className="space-y-4">
            <p className="text-[var(--text-primary)]">
              Esta alteração afeta uma transação recorrente ou parcelada. Como deseja aplicar?
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <Button variant="secondary" onClick={() => handleConfirmPropagation('single')}>
                Apenas esta (Atual)
              </Button>
              <Button onClick={() => handleConfirmPropagation('future')}>
                Esta e as Futuras
              </Button>
              <Button variant="ghost" className="text-sm" onClick={() => handleConfirmPropagation('all')}>
                Todas (Série Completa)
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
};
