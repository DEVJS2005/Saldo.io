import { supabase } from '../lib/supabase';
import { initialCategories, initialAccounts } from '../db/initialData';

export async function seedUserData(userId) {
  if (!userId) return;

  // Check if data already exists to avoid duplicates
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (count > 0) return; // User already has data

  // Seed Categories
  const categoriesToInsert = initialCategories.map(c => ({
    user_id: userId,
    name: c.name,
    type: c.type
  }));

  const { error: catError } = await supabase.from('categories').insert(categoriesToInsert);
  if (catError) console.error('Error seeding categories:', catError);

  // Seed Accounts
  const accountsToInsert = initialAccounts.map(a => ({
    user_id: userId,
    name: a.name,
    type: a.type,
    limit: a.limit || 0
  }));

  const { error: accError } = await supabase.from('accounts').insert(accountsToInsert);
  if (accError) console.error('Error seeding accounts:', accError);
}
