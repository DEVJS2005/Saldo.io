import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { startOfMonth, endOfMonth } from 'date-fns';
import { db } from '../db/db';

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
  const [loading, setLoading] = useState(true);

  const fetchBudget = useCallback(async () => {
    if (!user) return;

    const start = startOfMonth(monthDate).toISOString();
    const end = endOfMonth(monthDate).toISOString();

    let monthlyData = [];
    let globalRealBalance = 0;
    const accountBalances = {};

    if (user.canSync) {
        // --- CLOUD MODE (Supabase) ---
        const { data, error: monthlyError } = await supabase
          .from('transactions')
          .select('*')
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false });

        if (monthlyError) console.error('Error fetching monthly budget:', monthlyError);
        else monthlyData = data || [];

        // Fetch Global Balance (RPC)
        const { data: summaryData, error: summaryError } = await supabase
            .rpc('get_financial_summary', { p_user_id: user.id });

        if (summaryError) {
            console.error('Error fetching financial summary:', summaryError);
        } else if (summaryData) {
            globalRealBalance = Number(summaryData.total_balance) || 0;
            const accBals = summaryData.accounts_balance || {};
            for (const [accId, bal] of Object.entries(accBals)) {
                accountBalances[accId] = Number(bal);
            }
        }
    } else {
        // --- LOCAL MODE (Dexie) ---
        try {
            // 1. Monthly Data
            monthlyData = await db.transactions
                .where('date').between(start, end, true, true)
                .reverse().sortBy('date');

            // 2. Global Balance Calculation (Client-side)
            const allTxs = await db.transactions.toArray();
            
            allTxs.forEach(t => {
                const val = Number(t.amount);
                const accId = String(t.accountId);
                
                if (accountBalances[accId] === undefined) accountBalances[accId] = 0;
                
                if (t.paymentStatus === 'paid') {
                    if (t.type === 'receita') {
                        globalRealBalance += val;
                        accountBalances[accId] += val;
                    } else if (t.type === 'despesa') {
                        globalRealBalance -= val;
                        accountBalances[accId] -= val;
                    }
                }
            });
        } catch (err) {
            console.error('Error in local budget calculation:', err);
        }
    }

    // Process Monthly Stats
    let income = 0;
    let expense = 0;
    let pendingIncome = 0;
    let pendingExpense = 0;

    const transactions = monthlyData.map(t => ({
        ...t,
        categoryId: t.category_id || t.categoryId,
        accountId: t.account_id || t.accountId,
        paymentStatus: t.payment_status || t.paymentStatus,
        createdAt: t.created_at || t.createdAt,
        recurrenceId: t.recurrence_id || t.recurrenceId,
        installmentId: t.installment_id || t.installmentId,
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

    // ... logic ...
    setStats({
        income,
        expense,
        balanceProjected: globalRealBalance + pendingIncome - pendingExpense,
        balanceReal: globalRealBalance,
        accountBalances,
        transactions
    });
    setLoading(false);

  }, [user, monthDate]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  return { ...stats, loading, refresh: fetchBudget };
}
