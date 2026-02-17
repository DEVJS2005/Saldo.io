import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useMasterData() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      
      const { data: cats, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      const { data: accs, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .order('name');

      if (catError) console.error('Error fetching categories:', catError);
      if (accError) console.error('Error fetching accounts:', accError);

      setCategories(cats || []);
      setAccounts(accs || []);
      setLoading(false);
    };

    fetchData();

    // Subscribe to changes
    const catSub = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
      .subscribe();

    const accSub = supabase
      .channel('accounts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => fetchData())
      .subscribe();

    return () => {
      catSub.unsubscribe();
      accSub.unsubscribe();
    };
  }, [user]);

  return { categories, accounts, loading };
}
