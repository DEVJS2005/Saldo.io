import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

export function useMonthlyComparison(selectedDate = new Date(), months = 12) {
  const { user } = useAuth();
  const endDate = endOfMonth(selectedDate);
  const startDate = startOfMonth(subMonths(selectedDate, months - 1));
  const monthKey = format(selectedDate, 'yyyy-MM'); // Cache key base

  const { data, isLoading: loading, refetch: refresh } = useQuery({
    queryKey: ['monthlyComparison', user?.id, monthKey, months],
    queryFn: async () => {
      const interval = eachMonthOfInterval({ start: startDate, end: endDate });

      const monthlyStats = interval.map(month => ({
        name: format(month, 'MMM/yy'),
        sortKey: format(month, 'yyyy-MM'),
        receita: 0,
        despesa: 0,
        saldo: 0,
      }));

      const { data: txs, error } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .is('deleted_at', null)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) throw error;

      const allTransactions = txs || [];

      allTransactions.forEach(t => {
        const tDate = new Date(t.date);
        const txMonthKey = format(tDate, 'yyyy-MM');
        const stats = monthlyStats.find(s => s.sortKey === txMonthKey);
        if (stats) {
          const amount = Number(t.amount);
          if (t.type === 'receita') stats.receita += amount;
          else if (t.type === 'despesa') stats.despesa += amount;
        }
      });

      // Calcular saldo e saldo acumulado mês a mês
      let acumulado = 0;
      monthlyStats.forEach(s => {
        s.saldo = s.receita - s.despesa;
        acumulado += s.saldo;
        s.saldo_acumulado = acumulado;
      });

      return monthlyStats;
    },
    enabled: !!user,
  });

  return { data: data || [], loading, refresh };
}
