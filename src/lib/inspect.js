import { supabase } from './supabase';

export async function inspectCategories(userId) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', '%duca%'); // Search for Education variations

  if (error) {
    console.error('Error fetching categories:', error);
    return;
  }

  console.log('--- FOUND CATEGORIES ---');
  console.table(data);
  return data;
}
