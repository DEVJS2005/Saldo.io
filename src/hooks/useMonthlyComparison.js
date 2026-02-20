import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval } from 'date-fns';
import { db } from '../db/db';

export function useMonthlyComparison(selectedDate = new Date()) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const endDate = endOfMonth(selectedDate);
    const startDate = startOfMonth(subMonths(selectedDate, 5));

    const interval = eachMonthOfInterval({
      start: startDate,
      end: endDate
    });

    // Initialize data structure for each month
    const monthlyStats = interval.map(month => ({
      name: format(month, 'MMM/yy'), // e.g., "Jan/24"
      sortKey: format(month, 'yyyy-MM'),
      receita: 0,
      despesa: 0
    }));

    let allTransactions = [];

    if (user.canSync) {
      // --- CLOUD MODE (Supabase) ---
      const { data: txs, error } = await supabase
        .from('transactions')
        .select('amount, type, date')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) {
        console.error('Error fetching comparison data:', error);
      } else {
        allTransactions = txs || [];
      }
    } else {
      // --- LOCAL MODE (Dexie) ---
      try {
        allTransactions = await db.transactions
          .where('date')
          .between(startDate.toISOString(), endDate.toISOString(), true, true)
          .toArray();
      } catch (err) {
        console.error('Error fetching local comparison data:', err);
      }
    }

    // Process transactions
    allTransactions.forEach(t => {
      const tDate = new Date(t.date);
      const monthKey = format(tDate, 'yyyy-MM');
      const stats = monthlyStats.find(s => s.sortKey === monthKey);
      
      if (stats) {
        const amount = Number(t.amount);
        if (t.type === 'receita') {
          stats.receita += amount;
        } else if (t.type === 'despesa') {
          stats.despesa += amount;
        }
      }
    });

    setData(monthlyStats);
    setLoading(false);
  }, [user, selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refresh: fetchData };
}
