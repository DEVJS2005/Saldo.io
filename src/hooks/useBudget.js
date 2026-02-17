import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { startOfMonth, endOfMonth } from 'date-fns';

export function useBudget(monthDate = new Date()) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    balanceProjected: 0,
    balanceReal: 0,
    accountBalances: {},
    transactions: []
  });

  const fetchBudget = useCallback(async () => {
    if (!user) return;

    const start = startOfMonth(monthDate).toISOString();
    const end = endOfMonth(monthDate).toISOString();

    // 1. Fetch Monthly Transactions (for list and monthly stats)
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (monthlyError) {
        console.error('Error fetching monthly budget:', monthlyError);
        return;
    }

    // 2. Fetch Global Balance (All Paid Transactions)
    // Optimization: In robust apps, use a Postgres function (RPC) or materialized view.
    // For now, we select 'amount, type, account_id' where status='paid'
    const { data: globalData, error: globalError } = await supabase
        .from('transactions')
        .select('amount, type, account_id')
        .eq('payment_status', 'paid');

    if (globalError) {
        console.error('Error fetching global balance:', globalError);
        return;
    }

    // Process Monthly Stats
    let income = 0;
    let expense = 0;
    let pendingIncome = 0;
    let pendingExpense = 0;

    const transactions = monthlyData.map(t => ({
        ...t,
        categoryId: t.category_id,
        accountId: t.account_id,
        paymentStatus: t.payment_status,
        createdAt: t.created_at,
        recurrenceId: t.recurrence_id,
        installmentId: t.installment_id,
        amount: Number(t.amount)
    }));

    transactions.forEach(t => {
      const val = t.amount;
      if (t.type === 'receita') {
          income += val;
          if (t.paymentStatus !== 'paid') pendingIncome += val;
      } else if (t.type === 'despesa') {
          expense += val;
          if (t.paymentStatus !== 'paid') pendingExpense += val;
      }
    });

    // Process Global Balance
    let globalRealBalance = 0;
    const accountBalances = {};

    globalData.forEach(t => {
        const val = Number(t.amount);
        const accId = t.account_id;
        
        if (!accountBalances[accId]) accountBalances[accId] = 0;

        if (t.type === 'receita') {
            globalRealBalance += val;
            accountBalances[accId] += val;
        } else if (t.type === 'despesa') {
            globalRealBalance -= val;
            accountBalances[accId] -= val;
        }
    });

    setStats({
        income,
        expense,
        balanceProjected: globalRealBalance + pendingIncome - pendingExpense,
        balanceReal: globalRealBalance,
        accountBalances,
        transactions
    });

  }, [user, monthDate]);

  useEffect(() => {
    fetchBudget();
    
    // Subscribe to changes to auto-update
    // Note: This listens to ALL database changes. We could filter by user_id in RLS, but client filter is limited.
    // Simple approach: Refresh on any change to 'transactions' table.
    const subscription = supabase
        .channel('budget_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
            fetchBudget();
        })
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
  }, [fetchBudget]);

  return { ...stats, refresh: fetchBudget };
}
