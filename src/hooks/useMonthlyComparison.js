import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval } from 'date-fns';

export function useMonthlyComparison(selectedDate = new Date(), months = 12) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const endDate = endOfMonth(selectedDate);
    const startDate = startOfMonth(subMonths(selectedDate, months - 1));

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

    if (error) console.error('Error fetching comparison data:', error);

    const allTransactions = txs || [];

    allTransactions.forEach(t => {
      const tDate = new Date(t.date);
      const monthKey = format(tDate, 'yyyy-MM');
      const stats = monthlyStats.find(s => s.sortKey === monthKey);
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

    setData(monthlyStats);
    setLoading(false);
  }, [user, selectedDate, months]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
