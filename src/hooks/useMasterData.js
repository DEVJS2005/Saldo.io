import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useMasterData() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: cats, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (catError) console.error('Error fetching categories:', catError);
    if (cats) setCategories(cats);

    const { data: accs, error: accError } = await supabase
      .from('accounts')
      .select('*')
      .order('name');

    if (accError) console.error('Error fetching accounts:', accError);
    if (accs) setAccounts(accs);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();

    const catSub = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
      .subscribe();

    const accSub = supabase
      .channel('accounts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(catSub);
      supabase.removeChannel(accSub);
    };
  }, [fetchData]);

  return { categories, accounts, loading, refreshData: fetchData };
}
