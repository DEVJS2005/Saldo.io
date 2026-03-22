import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useBudget(monthDate = new Date()) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const monthKey = format(monthDate, 'yyyy-MM');

  const { data: stats, isLoading: loading, refetch: refresh } = useQuery({
    queryKey: ['budget', user?.id, monthKey],
    queryFn: async () => {
      const start = startOfMonth(monthDate).toISOString();
      const end = endOfMonth(monthDate).toISOString();

      const { data, error: monthlyError } = await supabase
        .from('active_transactions')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .limit(150);

      if (monthlyError) throw monthlyError;
      const monthlyData = data || [];

      // Fetch Global Balance (RPC)
      const { data: summaryData, error: summaryError } = await supabase
          .rpc('get_financial_summary', { p_end_date: null });

      let globalRealBalance = 0;
      const accountBalances = {};

      if (summaryError) {
          console.error('Error fetching financial summary:', summaryError);
      } else if (summaryData) {
          globalRealBalance = Number(summaryData.total_balance) || 0;
          const accBals = summaryData.accounts_balance || {};
          for (const [accId, bal] of Object.entries(accBals)) {
              accountBalances[accId] = Number(bal);
          }
      }

      // Fetch Monthly Stats via RPC (Evita Loop O(n) no front e garante totalidade ignorando o limit 150)
      const { data: monthlyStats, error: statsError } = await supabase
          .rpc('get_monthly_budget_stats', { p_start_date: start, p_end_date: end });

      if (statsError) console.error('Error fetching monthly stats:', statsError);

      let income = Number(monthlyStats?.income) || 0;
      let expense = Number(monthlyStats?.expense) || 0;
      let pendingIncome = Number(monthlyStats?.pending_income) || 0;
      let pendingExpense = Number(monthlyStats?.pending_expense) || 0;

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

      return {
          income,
          expense,
          balanceProjected: globalRealBalance + pendingIncome - pendingExpense,
          balanceReal: globalRealBalance,
          accountBalances,
          transactions
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const txSub = supabase
      .channel('budget_transactions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['budget', user.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(txSub);
    };
  }, [user, queryClient]);

  const safeStats = stats || {
    income: 0,
    expense: 0,
    balanceProjected: 0,
    balanceReal: 0,
    accountBalances: {},
    transactions: []
  };

  return { ...safeStats, loading, refresh };
}
