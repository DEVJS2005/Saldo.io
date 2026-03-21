import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useBudgetLimits(selectedDate = new Date()) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const monthYear = format(selectedDate, 'yyyy-MM');

    const { data: budgets, isLoading: loading, refetch: refresh } = useQuery({
        queryKey: ['budgetLimits', user?.id, monthYear],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('budgets')
                .select('id, category_id, month_year, limit_amount')
                .eq('month_year', monthYear);
            if (error) throw error;
            return (data || []).map(b => ({
                id: b.id,
                categoryId: b.category_id,
                monthYear: b.month_year,
                limitAmount: Number(b.limit_amount),
            }));
        },
        enabled: !!user,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['budgetLimits', user?.id, monthYear] });
    };

    const setMutation = useMutation({
        mutationFn: async ({ categoryId, limitAmount }) => {
            if (!user || !categoryId || !limitAmount) return;
            const { error } = await supabase
                .from('budgets')
                .upsert(
                    { user_id: user.id, category_id: categoryId, month_year: monthYear, limit_amount: limitAmount },
                    { onConflict: 'user_id,category_id,month_year' }
                );
            if (error) throw error;
        },
        onSuccess: invalidate
    });

    const deleteMutation = useMutation({
        mutationFn: async (budgetId) => {
            if (!user || !budgetId) return;
            const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
            if (error) throw error;
        },
        onSuccess: invalidate
    });

    useEffect(() => {
        if (!user) return;
        const sub = supabase.channel('budget_limits_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, invalidate)
            .subscribe();
        return () => supabase.removeChannel(sub);
    }, [user, monthYear, queryClient]);

    return { 
        budgets: budgets || [], 
        loading, 
        setBudgetLimit: (categoryId, limitAmount) => setMutation.mutateAsync({ categoryId, limitAmount }), 
        deleteBudgetLimit: (budgetId) => deleteMutation.mutateAsync(budgetId), 
        refresh 
    };
}
