import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { addMonths } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const toNoonUTC = (dateInput) => {
  const [year, month, day] = typeof dateInput === 'string' && dateInput.length === 10
    ? dateInput.split('-').map(Number)
    : [new Date(dateInput).getFullYear(), new Date(dateInput).getMonth() + 1, new Date(dateInput).getDate()];

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
};

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleError = async (error) => {
    console.error('Transaction Error:', error);

    const msg = error.message || '';
    if (msg.includes('invalid_credentials') ||
        msg.includes('JWT expired') ||
        error.code === 'PGRST301' ||
        error.status === 401) {
        console.error("Auth error caught:", error);
        // mutateAsync já relança o erro, não precisamos dar throw aqui para não causar unhandled rejection
    }

    if (msg.includes('Sem conexão') || msg.includes('NetworkError') || msg.includes('Failed to fetch') || msg.includes('Load failed')) {
        alert('Sem conexão com a internet. Verifique sua rede e tente novamente.');
    }
  };

  const invalidateTransactionQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    // Outras chaves que podem ser afetadas, se implementarmos
    queryClient.invalidateQueries({ queryKey: ['budget'] });
    queryClient.invalidateQueries({ queryKey: ['budgetLimits'] });
    queryClient.invalidateQueries({ queryKey: ['monthlyComparison'] });
  };

  const addMutation = useMutation({
    mutationFn: async (data) => {
        if (!user) throw new Error('Usuário não autenticado');

        const {
          amount,
          date,
          description,
          categoryId,
          accountId,
          type,
          isRecurring,
          installments = 1,
        } = data;

        const startDate = toNoonUTC(date);
        const totalAmount = parseFloat(amount);

        if (!amount || !date || !categoryId || !accountId) {
          throw new Error('Campos obrigatórios faltando.');
        }

        const baseTransaction = {
          user_id: user.id,
          type,
          category_id: categoryId,
          account_id: accountId,
          amount: totalAmount,
          description,
          payment_status: data.paymentStatus || 'pending',
        };

        let transactionsToAdd = [];

        // HANDLE RECURRING
        if (data.isRecurring) {
          const recurrenceId = crypto.randomUUID();
          for (let i = 0; i < 12; i++) {
            const nextDate = addMonths(new Date(startDate), i);
            transactionsToAdd.push({
              ...baseTransaction,
              date: nextDate.toISOString(),
              month: nextDate.getUTCMonth(),
              year: nextDate.getUTCFullYear(),
              recurrence_id: recurrenceId,
              is_recurring: true,
              payment_status: i === 0 ? (data.paymentStatus || 'pending') : 'pending'
            });
          }
        }
        // HANDLE INSTALLMENTS
        else if (type === 'despesa' && installments > 1) {
          const installmentId = crypto.randomUUID();
          const startInstallment = parseInt(data.currentInstallment) || 1;
          const totalInstallments = parseInt(installments) || 1;
          const baseValue = Math.floor((totalAmount / totalInstallments) * 100) / 100;
          const loopCount = Math.max(0, totalInstallments - startInstallment + 1);

          for (let i = 0; i < loopCount; i++) {
             const parcelNumber = startInstallment + i;
             const isLast = parcelNumber === totalInstallments;
             const finalParcelValue = isLast
                ? Number((totalAmount - (baseValue * (totalInstallments - 1))).toFixed(2))
                : baseValue;
             const parcelDate = toNoonUTC(addMonths(startDate, i));

             transactionsToAdd.push({
                user_id: user.id,
                type,
                category_id: categoryId,
                account_id: accountId,
                amount: finalParcelValue,
                description: `${description} (${parcelNumber}/${totalInstallments})`,
                payment_status: 'pending',
                date: parcelDate.toISOString(),
                month: parcelDate.getUTCMonth(),
                year: parcelDate.getUTCFullYear(),
                installment_id: installmentId,
                installment_number: parcelNumber,
                total_installments: totalInstallments,
                is_recurring: false
             });
          }
        }
        // SINGLE
        else {
          transactionsToAdd.push({
            ...baseTransaction,
            date: startDate.toISOString(),
            month: startDate.getUTCMonth(),
            year: startDate.getUTCFullYear(),
            is_recurring: false
          });
        }

        if (transactionsToAdd.length === 0) {
            console.warn('Nenhuma transação gerada para adicionar.');
            return;
        }

        const { error } = await supabase.from('transactions').insert(transactionsToAdd);
        if (error) throw error;
    },
    onSuccess: invalidateTransactionQueries,
    onError: handleError
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, deleteMode = 'single' }) => {
        if (!user) return;

        const deletedAt = new Date().toISOString();
        if (deleteMode === 'single') {
            const { error } = await supabase
              .from('transactions')
              .update({ deleted_at: deletedAt, deleted_by: user.id })
              .eq('id', id);
            if (error) throw error;
            return;
        }

        const { data: t, error: fetchError } = await supabase
          .from('transactions')
          .select()
          .eq('id', id)
          .single();
        if (fetchError) throw fetchError;
        if (!t) return;

        let query;
        if (t.recurrence_id) {
            query = supabase.from('transactions')
              .update({ deleted_at: deletedAt, deleted_by: user.id })
              .eq('recurrence_id', t.recurrence_id);
            if (deleteMode === 'future') query = query.gte('date', t.date);
        } else if (t.installment_id) {
            if (deleteMode === 'all') {
                query = supabase.from('transactions')
                  .update({ deleted_at: deletedAt, deleted_by: user.id })
                  .eq('installment_id', t.installment_id);
            } else if (deleteMode === 'future') {
                query = supabase.from('transactions')
                  .update({ deleted_at: deletedAt, deleted_by: user.id })
                  .eq('installment_id', t.installment_id)
                  .gte('date', t.date);
            } else {
                query = supabase.from('transactions')
                  .update({ deleted_at: deletedAt, deleted_by: user.id })
                  .eq('id', id);
            }
        } else {
            query = supabase.from('transactions')
              .update({ deleted_at: deletedAt, deleted_by: user.id })
              .eq('id', id);
        }

        const { error: deleteError } = await query;
        if (deleteError) throw deleteError;
    },
    onSuccess: invalidateTransactionQueries,
    onError: handleError
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, mode = 'single' }) => {
          let normalizedDate, normalizedMonth, normalizedYear;
          if (data.date) {
             const d = toNoonUTC(data.date);
             normalizedDate = d.toISOString();
             normalizedMonth = d.getUTCMonth();
             normalizedYear = d.getUTCFullYear();
          }

          const updateData = {};
          if (data.amount !== undefined) updateData.amount = data.amount;
          if (data.description !== undefined) updateData.description = data.description;
          if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
          if (data.accountId !== undefined) updateData.account_id = data.accountId;
          if (data.type !== undefined) updateData.type = data.type;
          if (data.paymentStatus !== undefined) updateData.payment_status = data.paymentStatus;

          if (normalizedDate) {
             updateData.date = normalizedDate;
             updateData.month = normalizedMonth;
             updateData.year = normalizedYear;
          }

          // Handle Recurrence Toggling
          if (typeof data.isRecurring === 'boolean') {
              updateData.is_recurring = data.isRecurring;
              if (!data.isRecurring) updateData.recurrence_id = null;

              if (data.isRecurring && !data.recurrenceId) {
                 const newRecurrenceId = crypto.randomUUID();
                 updateData.recurrence_id = newRecurrenceId;

                 const startDate = toNoonUTC(normalizedDate || new Date());
                 const transactionsToAdd = [];
                 for (let i = 1; i < 12; i++) {
                    const nextDate = addMonths(startDate, i);
                    transactionsToAdd.push({
                      user_id: user.id,
                      type: data.type,
                      category_id: data.categoryId,
                      account_id: data.accountId,
                      amount: data.amount,
                      description: data.description,
                      payment_status: 'pending',
                      date: nextDate.toISOString(),
                      month: nextDate.getUTCMonth(),
                      year: nextDate.getUTCFullYear(),
                      recurrence_id: newRecurrenceId,
                      is_recurring: true
                    });
                 }
                 if (transactionsToAdd.length > 0) {
                     const { error: insError } = await supabase.from('transactions').insert(transactionsToAdd);
                     if (insError) throw insError;
                 }
              }
          }

          // Series Update
          if (mode === 'future' || mode === 'all') {
             let recurrenceId = data.recurrenceId;
             let installmentId = data.installmentId;
             let currentInstallmentNumber = data.currentInstallment;

             if (!recurrenceId && !installmentId) {
                const { data: t } = await supabase
                  .from('transactions')
                  .select('recurrence_id, installment_id, installment_number')
                  .eq('id', id)
                  .single();
                recurrenceId = t?.recurrence_id;
                installmentId = t?.installment_id;
                if (t?.installment_number && !currentInstallmentNumber) currentInstallmentNumber = t.installment_number;
             }

             if (recurrenceId) {
                 if (updateData.date) {
                     const { data: currentTx } = await supabase
                       .from('transactions').select('date').eq('id', id).single();
                     if (currentTx) {
                         const oldDate = new Date(currentTx.date);
                         const newDate = new Date(updateData.date);
                         const diffTime = newDate.getTime() - oldDate.getTime();

                         if (diffTime !== 0) {
                             let query = supabase.from('transactions').select('id, date').eq('recurrence_id', recurrenceId);
                             if (mode === 'future') query = query.gte('date', currentTx.date);
                             const { data: relatedTxs } = await query;

                             if (relatedTxs) {
                                 const updates = relatedTxs.map(tx => {
                                     const txDate = new Date(tx.date);
                                     const shiftedDate = new Date(txDate.getTime() + diffTime);
                                     return supabase.from('transactions').update({
                                         ...updateData,
                                         date: shiftedDate.toISOString(),
                                         month: shiftedDate.getUTCMonth(),
                                         year: shiftedDate.getUTCFullYear()
                                     }).eq('id', tx.id);
                                 });
                                 await Promise.all(updates);
                                 return;
                             }
                         } else {
                               delete updateData.date; delete updateData.month; delete updateData.year;
                         }
                     }
                 }
                 const query = supabase.from('transactions').update(updateData).eq('recurrence_id', recurrenceId);
                 if (mode === 'future') {
                     const { data: currentTx } = await supabase.from('transactions').select('date').eq('id', id).single();
                     if (currentTx) query.gte('date', currentTx.date);
                 }
                 const { error: batchError } = await query;
                 if (batchError) throw batchError;
                 return;
             } else if (installmentId) {
                 if (updateData.date) { delete updateData.date; delete updateData.month; delete updateData.year; }
                 const query = supabase.from('transactions').update(updateData).eq('installment_id', installmentId);
                 if (mode === 'future') {
                     if (currentInstallmentNumber) query.gte('installment_number', currentInstallmentNumber);
                     else query.gte('date', normalizedDate || new Date().toISOString());
                 }
                 const { error: batchError } = await query;
                 if (batchError) throw batchError;
                 return;
             }
          }

          const { error } = await supabase.from('transactions').update(updateData).eq('id', id);
          if (error) throw error;
    },
    onSuccess: invalidateTransactionQueries,
    onError: handleError
  });

  return {
    addTransaction: addMutation.mutateAsync,
    deleteTransaction: (id, deleteMode) => deleteMutation.mutateAsync({ id, deleteMode }),
    updateTransaction: (id, data, mode) => updateMutation.mutateAsync({ id, data, mode }),
    validateAndRepairTransactions: async () => ({ message: 'Not needed in Cloud' }),
    isLoadingTransaction: addMutation.isPending || deleteMutation.isPending || updateMutation.isPending
  };
}
