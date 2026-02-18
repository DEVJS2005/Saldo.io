import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../db/db';

export function useMasterData() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    if (user.canSync) {
        // --- CLOUD MODE (Supabase) ---
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
    } else {
        // --- LOCAL MODE (Dexie) ---
        try {
            const cats = await db.categories.orderBy('name').toArray();
            setCategories(cats);

            const accs = await db.accounts.orderBy('name').toArray();
            setAccounts(accs);
        } catch (err) {
            console.error('Error fetching local data:', err);
        }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();

    let catSub, accSub;

    if (user?.canSync) {
        // Subscribe to Supabase changes
        catSub = supabase
          .channel('categories_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
          .subscribe();

        accSub = supabase
          .channel('accounts_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => fetchData())
          .subscribe();
    }

    return () => {
      if (catSub) supabase.removeChannel(catSub);
      if (accSub) supabase.removeChannel(accSub);
    };
  }, [fetchData, user?.canSync]);

  return { categories, accounts, loading, refreshData: fetchData };
}
