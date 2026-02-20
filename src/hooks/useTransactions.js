import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { useState, useCallback, useEffect } from 'react';
import { db } from '../db/db';

export function useTransactions() {
  const { user } = useAuth();

  // Helper to check connectivity and session
  const checkOnlineAndSession = async () => {
    if (!navigator.onLine) {
        throw new Error('Sem conexão com a internet. Operação em nuvem indisponível.');
    }
    // Optional: Check if session is valid before request? 
    // Usually better to let the request fail with 401, but we can check if user is locally present.
    if (!user) throw new Error('Usuário não autenticado.');
  };

  const handleError = async (error) => {
    console.error('Transaction Error:', error);
    
    // Handle specific Supabase Auth errors
    const msg = error.message || '';
    if (msg.includes('invalid_credentials') || 
        msg.includes('JWT expired') ||
        error.code === 'PGRST301' || 
        error.status === 401) {
        
        alert('Sua sessão expirou. Por favor, faça login novamente.');
        await supabase.auth.signOut();
        window.location.href = '/login'; // Force redirect
        return;
    }

    if (msg.includes('Sem conexão')) {
        alert(msg);
        return;
    }

    throw error; // Re-throw unknown errors
  };

  const addTransaction = async (data) => {
    try {
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
    
        const startDate = new Date(date); 
        startDate.setUTCHours(12, 0, 0, 0); 
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
              month: nextDate.getMonth(),
              year: nextDate.getFullYear(),
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
             const parcelDate = addMonths(new Date(startDate), i);
    
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
    
        if (user.canSync) {
            await checkOnlineAndSession();
            const { error } = await supabase.from('transactions').insert(transactionsToAdd);
            if (error) throw error;
        } else {
            // Local Mode (Dexie)
            const localTxs = transactionsToAdd.map(t => ({
                userId: t.user_id,
                type: t.type,
                categoryId: t.category_id,
                accountId: t.account_id,
                amount: t.amount,
                description: t.description,
                paymentStatus: t.payment_status,
                date: t.date,
                month: t.month,
                year: t.year,
                recurrenceId: t.recurrence_id,
                isRecurring: t.is_recurring,
                installmentId: t.installment_id,
                installmentNumber: t.installment_number,
                totalInstallments: t.total_installments,
                createdAt: new Date().toISOString()
            }));
            await db.transactions.bulkAdd(localTxs);
        }
    } catch (error) {
        await handleError(error);
    }
  };

  const deleteTransaction = async (id, deleteMode = 'single') => {
    try {
        if (!user) return;
    
        if (user.canSync) {
            await checkOnlineAndSession();

            if (deleteMode === 'single') {
                const { error } = await supabase.from('transactions').delete().eq('id', id);
                if (error) throw error;
                return;
            }
    
            const { data: t, error: fetchError } = await supabase.from('transactions').select().eq('id', id).single();
            if (fetchError) throw fetchError;
            if (!t) return;
    
            let query;
            if (t.recurrence_id) {
                query = supabase.from('transactions').delete().eq('recurrence_id', t.recurrence_id);
                if (deleteMode === 'future') query = query.gte('date', t.date);
            } else if (t.installment_id) {
                if (deleteMode === 'all') {
                    query = supabase.from('transactions').delete().eq('installment_id', t.installment_id);
                } else if (deleteMode === 'future') {
                    query = supabase.from('transactions').delete().eq('installment_id', t.installment_id).gte('date', t.date);
                } else {
                    query = supabase.from('transactions').delete().eq('id', id);
                }
            } else {
                query = supabase.from('transactions').delete().eq('id', id);
            }
            
            const { error: deleteError } = await query;
            if (deleteError) throw deleteError;

        } else {
            // --- LOCAL MODE (Dexie) ---
            if (deleteMode === 'single') {
                await db.transactions.delete(id);
                return;
            }
    
            const t = await db.transactions.get(id);
            if (!t) return;
    
            if (t.recurrenceId) {
                 const txs = await db.transactions.where('recurrenceId').equals(t.recurrenceId).toArray();
                 const toDelete = deleteMode === 'future' 
                    ? txs.filter(tx => tx.date >= t.date).map(tx => tx.id)
                    : txs.map(tx => tx.id);
                 
                 await db.transactions.bulkDelete(toDelete);
    
            } else if (t.installmentId) {
                 const txs = await db.transactions.where('installmentId').equals(t.installmentId).toArray();
                 let toDelete = [];
                 
                 if (deleteMode === 'all') {
                     toDelete = txs.map(tx => tx.id);
                 } else if (deleteMode === 'future') {
                     toDelete = txs.filter(tx => tx.date >= t.date).map(tx => tx.id);
                 } else {
                     toDelete = [id];
                 }
                 await db.transactions.bulkDelete(toDelete);
            } else {
                await db.transactions.delete(id);
            }
        }
    } catch (error) {
        await handleError(error);
    }
  };

  const updateTransaction = async (id, data, mode = 'single') => {
    try {
          // Shared Date Normalization (Noon UTC)
          let normalizedDate, normalizedMonth, normalizedYear;
          if (data.date) {
             const d = new Date(data.date);
             d.setUTCHours(12, 0, 0, 0); 
             normalizedDate = d.toISOString();
             normalizedMonth = d.getUTCMonth();
             normalizedYear = d.getUTCFullYear();
          }
    
          if (user.canSync) {
              await checkOnlineAndSession();

              // --- CLOUD MODE (Supabase) ---
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
                     
                     // Generate Future Transactions (Supabase)
                     const startDate = new Date(normalizedDate || new Date());
                     startDate.setUTCHours(12, 0, 0, 0);
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
                          month: nextDate.getMonth(),
                          year: nextDate.getFullYear(),
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
                    const { data: t } = await supabase.from('transactions').select('recurrence_id, installment_id, installment_number').eq('id', id).single();
                    recurrenceId = t?.recurrence_id;
                    installmentId = t?.installment_id;
                    if (t?.installment_number && !currentInstallmentNumber) currentInstallmentNumber = t.installment_number;
                 }
    
                 if (recurrenceId) {
                     if (updateData.date) {
                         const { data: currentTx } = await supabase.from('transactions').select('date').eq('id', id).single();
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
    
          } else {
              // --- LOCAL MODE (Dexie) ---
              const updateData = {};
              if (data.amount !== undefined) updateData.amount = data.amount;
              if (data.description !== undefined) updateData.description = data.description;
              if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
              if (data.accountId !== undefined) updateData.accountId = data.accountId;
              if (data.type !== undefined) updateData.type = data.type;
              if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
              
              if (normalizedDate) {
                 updateData.date = normalizedDate;
                 updateData.month = normalizedMonth;
                 updateData.year = normalizedYear;
              }
    
              if (typeof data.isRecurring === 'boolean') {
                  updateData.isRecurring = data.isRecurring;
                  if (!data.isRecurring) updateData.recurrenceId = null;
    
                  if (data.isRecurring && !data.recurrenceId) {
                     const newRecurrenceId = crypto.randomUUID();
                     updateData.recurrenceId = newRecurrenceId;
                     
                     const startDate = new Date(normalizedDate || new Date());
                     startDate.setUTCHours(12, 0, 0, 0);
                     const localTxs = [];
                     for (let i = 1; i < 12; i++) {
                        const nextDate = addMonths(startDate, i);
                        localTxs.push({
                          userId: user.id,
                          type: data.type,
                          categoryId: data.categoryId,
                          accountId: data.accountId,
                          amount: data.amount,
                          description: data.description,
                          paymentStatus: 'pending',
                          date: nextDate.toISOString(),
                          month: nextDate.getMonth(),
                          year: nextDate.getFullYear(),
                          recurrenceId: newRecurrenceId,
                          isRecurring: true,
                          createdAt: new Date().toISOString()
                        });
                     }
                     if (localTxs.length > 0) await db.transactions.bulkAdd(localTxs);
                  }
              }
    
              if (mode === 'future' || mode === 'all') {
                 let recurrenceId = data.recurrenceId;
                 let installmentId = data.installmentId;
                 
                 if (!recurrenceId && !installmentId) {
                     const t = await db.transactions.get(id);
                     recurrenceId = t?.recurrenceId;
                     installmentId = t?.installmentId;
                 }
    
                 if (recurrenceId) {
                     const relatedTxs = await db.transactions.where('recurrenceId').equals(recurrenceId).toArray();
                     const currentTx = await db.transactions.get(id);
                     
                     if (updateData.date && currentTx) {
                         const oldDate = new Date(currentTx.date);
                         const newDate = new Date(updateData.date);
                         const diffTime = newDate.getTime() - oldDate.getTime();
    
                         if (diffTime !== 0) {
                             const updates = relatedTxs
                                 .filter(tx => mode === 'all' || (mode === 'future' && tx.date >= currentTx.date))
                                 .map(tx => {
                                     const txDate = new Date(tx.date);
                                     const shiftedDate = new Date(txDate.getTime() + diffTime);
                                     return {
                                         ...tx,
                                         ...updateData,
                                         date: shiftedDate.toISOString(),
                                         month: shiftedDate.getUTCMonth(),
                                         year: shiftedDate.getUTCFullYear()
                                     };
                                 });
                             await db.transactions.bulkPut(updates);
                             return;
                         } else {
                             delete updateData.date; delete updateData.month; delete updateData.year;
                         }
                     }
                     
                     const targets = relatedTxs.filter(tx => mode === 'all' || (mode === 'future' && currentTx && tx.date >= currentTx.date));
                     const updates = targets.map(tx => ({ ...tx, ...updateData }));
                     await db.transactions.bulkPut(updates);
                     return;
    
                 } else if (installmentId) {
                     if (updateData.date) { delete updateData.date; delete updateData.month; delete updateData.year; }
                     
                     const relatedTxs = await db.transactions.where('installmentId').equals(installmentId).toArray();
                     const currentTx = await db.transactions.get(id);
                     
                     const targets = relatedTxs.filter(tx => 
                         mode === 'all' || 
                         (mode === 'future' && currentTx && (tx.installmentNumber >= (currentTx.installmentNumber || 0) || tx.date >= currentTx.date))
                     );
                     
                     const updates = targets.map(tx => ({ ...tx, ...updateData }));
                     await db.transactions.bulkPut(updates);
                     return;
                 }
              }
    
              // Single Update (Dexie)
              await db.transactions.update(id, updateData);
          }
    } catch (error) {
        await handleError(error);
    }
  };

  // React Hook for fetching
  // React Hook for fetching
  const useTransactionsQuery = (date) => {
      const [transactions, setTransactions] = useState([]);
      const [loading, setLoading] = useState(true);

      const fetchTransactions = useCallback(async () => {
          if (!user || !date) return;
          setLoading(true);
          
          const start = startOfMonth(date).toISOString();
          const end = endOfMonth(date).toISOString();

          if (user.canSync) {
              const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: false });
              
              if (error) console.error('Error fetching transactions:', error);
              else {
                  // Map back to camelCase for UI consumption
                  const mapped = data.map(t => ({
                      ...t,
                      categoryId: t.category_id,
                      accountId: t.account_id,
                      paymentStatus: t.payment_status,
                      createdAt: t.created_at,
                      recurrenceId: t.recurrence_id,
                      installmentId: t.installment_id,
                      amount: Number(t.amount)
                  }));
                  setTransactions(mapped);
              }
          } else {
              // --- LOCAL MODE (Dexie) ---
              try {
                  const localData = await db.transactions
                    .where('date')
                    .between(start, end, true, true)
                    .reverse()
                    .toArray();
                    
                  const mapped = localData.map(t => ({
                      ...t,
                      amount: Number(t.amount)
                  }));
                  setTransactions(mapped);
              } catch (err) {
                  console.error('Error fetching local transactions:', err);
              }
          }
          setLoading(false);
      }, [user, date]);

      useEffect(() => {
          fetchTransactions();
          
          let sub;
          if (user?.canSync) {
               sub = supabase
                .channel('transactions_list_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
                .subscribe();
          }
          
          return () => {
              if (sub) supabase.removeChannel(sub);
          };
      }, [fetchTransactions, user?.canSync]);

      return transactions;
  };

  return {
    addTransaction,
    deleteTransaction,
    updateTransaction,
    useTransactionsQuery, // Replaces getTransactionsByMonth logic in components
    validateAndRepairTransactions: async () => ({ message: 'Not needed in Cloud' })
  };
}
