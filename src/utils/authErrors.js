export const getErrorMessage = (error, t) => {
  if (!error) return null;
  
  const message = error.message || '';
  const code = error.code || '';

  // Auth Errors
  if (message.includes('Invalid login credentials')) return t ? t('errors.invalid_credentials') : 'E-mail ou senha incorretos.';
  if (message.includes('User not found')) return t ? t('errors.user_not_found') : 'Usuário não encontrado.';
  if (message.includes('Password should be at least 6 characters')) return t ? t('auth.err_password_length') : 'A senha deve ter pelo menos 6 caracteres.';
  if (message.includes('Email not confirmed')) return t ? t('errors.email_not_confirmed') : 'E-mail não confirmado. Por favor, verifique seu e-mail (e a pasta de spam).';
  if (message.includes('User already registered')) return t ? t('errors.user_already_registered') : 'Este e-mail já está cadastrado.';
  if (message.includes('invalid_credentials')) return t ? t('errors.invalid_credentials') : 'Credenciais inválidas.';
  if (message.includes('Email rate limit exceeded')) return t ? t('errors.rate_limit') : 'Muitas tentativas. Tente novamente em alguns minutos.';

  // General Errors
  if (message.includes('Network Error') || message.includes('Failed to fetch')) {
    return t ? t('errors.network_error') : 'Erro de conexão. Verifique sua internet.';
  }

  // Fallbacks by code if available
  switch (code) {
    case 'PGRST116': return t ? t('errors.no_records') : 'Nenhum registro encontrado.';
    case '23505': return t ? t('errors.record_exists') : 'Este registro já existe.';
    case 'PGRST301': return t ? t('errors.session_expired') : 'Sessão expirada. Faça login novamente.';
    default: return message || (t ? t('errors.unexpected') : 'Ocorreu um erro inesperado.');
  }
};
