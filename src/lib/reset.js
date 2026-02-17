import { supabase } from './supabase';

export async function resetCloudData() {
  const { error: tErr } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: cErr } = await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: aErr } = await supabase.from('accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (tErr || cErr || aErr) {
    throw new Error('Failed to reset some data');
  }
  return true;
}
