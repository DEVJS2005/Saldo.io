import { supabase } from './supabase';

export async function resetCloudData() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Usuário não autenticado. Impossível prosseguir com a limpeza.');

  // Audit Log recording the deletion request
  await supabase.from('audit_logs').insert({
      admin_id: user.id, // User acting on their own profile
      target_user_id: user.id,
      action: 'USER_RESET_DATA',
      metadata: { reason: 'User requested explicit full data deletion via Settings prompt.' }
  });

  const { error: tErr } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: cErr } = await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: aErr } = await supabase.from('accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (tErr || cErr || aErr) {
    throw new Error('Falha ao resetar alguns dados');
  }
  return true;
}
