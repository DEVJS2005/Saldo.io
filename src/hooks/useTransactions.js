import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { addMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { useState, useCallback, useEffect } from 'react';

export function useTransactions() {
  const { user } = useAuth();

  const addTransaction = async (data) => {
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
    startDate.setUTCHours(12, 0, 0, 0); // Force Noon UTC to prevent timezone shift
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
      
      // Current + Next 11 months
      for (let i = 0; i < 12; i++) {
        const nextDate = addMonths(startDate, i);
        transactionsToAdd.push({
          ...baseTransaction,
          date: nextDate.toISOString(),
          month: nextDate.getMonth(),
          year: nextDate.getFullYear(),
          recurrence_id: recurrenceId,
          is_recurring: true,
          payment_status: i === 0 ? (data.paymentStatus || 'pending') : 'pending' // Only first set by user
        });
      }
    } 
    // HANDLE INSTALLMENTS
    else if (type === 'despesa' && installments > 1) {
      const installmentId = crypto.randomUUID();
      const startInstallment = data.currentInstallment || 1;
      const totalInstallments = Number(installments) || 1; // Default to 1 to avoid /0
      
      // Calculate individual parcel value based on TOTAL amount and TOTAL installments
      // Note: If user enters "Total Value", we divide. If "Parcel Value", logic in Form multiplies it back to Total.
      // Ideally, we should base this on the "Remaining Value" if starting mid-way, 
      // but for simplicity and standard app behavior:
      // We assume 'amount' passed here IS the TOTAL amount for the whole series.
      // So checking "Parcel Value" checkbox in form handles the math before sending here.
      
      const baseValue = Math.floor((totalAmount / totalInstallments) * 100) / 100;
      
      // We only create records from startInstallment to totalInstallments
      // e.g. Total 10, Start 3. We create 3, 4 ... 10.
      const loopCount = Math.max(0, totalInstallments - startInstallment + 1);

      for (let i = 0; i < loopCount; i++) {
         const parcelNumber = startInstallment + i;
         
         const isLast = parcelNumber === totalInstallments;
         const finalParcelValue = isLast 
            ? Number((totalAmount - (baseValue * (totalInstallments - 1))).toFixed(2)) 
            : baseValue;
         
         const parcelDate = addMonths(startDate, i);

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
        // This might happen if user starts at installment > totalInstallments
        // Just return silently or throw error?
        // Let's assume it's a no-op but warn
        console.warn('Nenhuma transação gerada para adicionar. Verifique os parâmetros de parcelamento.');
        return;
    }

    const { error } = await supabase.from('transactions').insert(transactionsToAdd);
    if (error) throw error;
  };

  const deleteTransaction = async (id, deleteMode = 'single') => {
    if (!user) return;

    if (deleteMode === 'single') {
        await supabase.from('transactions').delete().eq('id', id);
        return;
    }

    // Fetch transaction to get recurrence/installment ID
    const { data: t } = await supabase.from('transactions').select().eq('id', id).single();
    if (!t) return;

    if (t.recurrence_id) {
        let query = supabase.from('transactions').delete().eq('recurrence_id', t.recurrence_id);
        if (deleteMode === 'future') {
            query = query.gte('date', t.date);
        }
        await query;
    } else if (t.installment_id) {
        if (deleteMode === 'all') {
            await supabase.from('transactions').delete().eq('installment_id', t.installment_id);
        } else if (deleteMode === 'future') {
             await supabase.from('transactions')
                .delete()
                .eq('installment_id', t.installment_id)
                .gte('date', t.date);
        } else {
            await supabase.from('transactions').delete().eq('id', id);
        }
    } else {
        await supabase.from('transactions').delete().eq('id', id);
    }
  };

  const updateTransaction = async (id, data, mode = 'single') => {
      const updateData = {};
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
      if (data.accountId !== undefined) updateData.account_id = data.accountId;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.paymentStatus !== undefined) updateData.payment_status = data.paymentStatus;
      if (data.currentInstallment !== undefined) updateData.installment_number = data.currentInstallment;
      if (data.installments !== undefined) updateData.total_installments = data.installments;
      
      if (data.date) {
         // Force Noon UTC to avoid timezone shifts (e.g. 2026-03-01T00:00Z -> 2026-02-28T21:00 Local)
         // We want "Accounting Date" to be stable.
         const d = new Date(data.date);
         d.setUTCHours(12, 0, 0, 0); 

         updateData.date = d.toISOString();
         updateData.month = d.getUTCMonth(); // 0-11
         updateData.year = d.getUTCFullYear();
      }

      // Handle Recurrence Toggling
      if (typeof data.isRecurring === 'boolean') {
          updateData.is_recurring = data.isRecurring;

          // If changing from Single -> Recurring (and we don't have a recurrenceId in data implies it was single)
          // We check if it truly didn't have one before via the passed data or by fetching (safer to fetch but expensive).
          // For now, let's assume if the UI allows it, we do it.
          if (data.isRecurring && !data.recurrenceId) {
             const newRecurrenceId = crypto.randomUUID();
             updateData.recurrence_id = newRecurrenceId;
             
             // Generate Future Transactions
             const startDate = new Date(data.date || new Date());
             startDate.setUTCHours(12, 0, 0, 0); // Force Noon UTC for recurring series too
             const transactionsToAdd = [];
             
             // Add next 11 months
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
                 const { error: insertError } = await supabase.from('transactions').insert(transactionsToAdd);
                 if (insertError) console.error('Error creating future recurring transactions:', insertError);
             }
          }
      }

      // If updating a series
      // If updating a series
      if (mode === 'future' || mode === 'all') {
         // Fetch recurrence_id OR installment_id if not in data
         let recurrenceId = data.recurrenceId;
         let installmentId = data.installmentId;
         let currentInstallmentNumber = data.currentInstallment; // From form

         if (!recurrenceId && !installmentId) {
            const { data: t } = await supabase.from('transactions').select('recurrence_id, installment_id, installment_number').eq('id', id).single();
            recurrenceId = t?.recurrence_id;
            installmentId = t?.installment_id;
            if (t?.installment_number && !currentInstallmentNumber) {
                currentInstallmentNumber = t.installment_number;
            }
         }

         if (recurrenceId) {
             const query = supabase.from('transactions').update(updateData).eq('recurrence_id', recurrenceId);
             if (mode === 'future') {
                 // For recurrence, date is the best proxy we have
                 query.gte('date', updateData.date || new Date().toISOString()); 
             }
             await query;
             return; 
         } else if (installmentId) {
             const query = supabase.from('transactions').update(updateData).eq('installment_id', installmentId);
             if (mode === 'future') {
                 // For installments, use installment_number for precision
                 if (currentInstallmentNumber) {
                    query.gte('installment_number', currentInstallmentNumber);
                 } else {
                    // Fallback to date if number missing (shouldn't happen)
                    query.gte('date', updateData.date || new Date().toISOString());
                 }
             }
             await query;
             return;
         }
      }

      const { error } = await supabase.from('transactions').update(updateData).eq('id', id);
      if (error) throw error;
  };

  // React Hook for fetching
  const useTransactionsQuery = (date) => {
      const [transactions, setTransactions] = useState([]);
      const [loading, setLoading] = useState(true);

      const fetchTransactions = useCallback(async () => {
          if (!user || !date) return;
          setLoading(true);
          
          const start = startOfMonth(date).toISOString();
          const end = endOfMonth(date).toISOString();

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
                  // Convert amount to number just in case
                  amount: Number(t.amount)
              }));
              setTransactions(mapped);
          }
          setLoading(false);
      }, [user, date]);

      useEffect(() => {
          fetchTransactions();
      }, [fetchTransactions]);

      // Realtime subscription could go here
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
