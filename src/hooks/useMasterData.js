import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function useMasterData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const catSub = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ['categories', user.id] });
      })
      .subscribe();

    const accSub = supabase
      .channel('accounts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['accounts', user.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(catSub);
      supabase.removeChannel(accSub);
    };
  }, [user, queryClient]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
  };

  return { 
    categories, 
    accounts, 
    loading: loadingCategories || loadingAccounts, 
    refreshData 
  };
}
