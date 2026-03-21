import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

/**
 * useBudgetLimits
 * Gerencia orçamentos mensais por categoria via Supabase.
 */
export function useBudgetLimits(selectedDate = new Date()) {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);

    const monthYear = format(selectedDate, 'yyyy-MM');

    const fetchBudgets = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('budgets')
                .select('id, category_id, month_year, limit_amount')
                .eq('month_year', monthYear);
            if (error) throw error;
            setBudgets(
                (data || []).map(b => ({
                    id: b.id,
                    categoryId: b.category_id,
                    monthYear: b.month_year,
                    limitAmount: Number(b.limit_amount),
                }))
            );
        } catch (err) {
            console.error('[useBudgetLimits] fetchBudgets:', err);
        } finally {
            setLoading(false);
        }
    }, [user, monthYear]);

    useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

    /**
     * Criar ou atualizar o limite de uma categoria no mês atual.
     */
    const setBudgetLimit = useCallback(async (categoryId, limitAmount) => {
        if (!user || !categoryId || !limitAmount) return;
        try {
            const { error } = await supabase
                .from('budgets')
                .upsert(
                    { user_id: user.id, category_id: categoryId, month_year: monthYear, limit_amount: limitAmount },
                    { onConflict: 'user_id,category_id,month_year' }
                );
            if (error) throw error;
            await fetchBudgets();
        } catch (err) {
            console.error('[useBudgetLimits] setBudgetLimit:', err);
            throw err;
        }
    }, [user, monthYear, fetchBudgets]);

    /**
     * Remover o orçamento de uma categoria no mês atual.
     */
    const deleteBudgetLimit = useCallback(async (budgetId) => {
        if (!user || !budgetId) return;
        try {
            const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
            if (error) throw error;
            await fetchBudgets();
        } catch (err) {
            console.error('[useBudgetLimits] deleteBudgetLimit:', err);
            throw err;
        }
    }, [user, fetchBudgets]);

    return { budgets, loading, setBudgetLimit, deleteBudgetLimit, refresh: fetchBudgets };
}
