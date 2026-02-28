export const getErrorMessage = (error) => {
  if (!error) return null;
  
  const message = error.message || '';
  const code = error.code || '';

  // Auth Errors
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('User not found')) return 'Usuário não encontrado.';
  if (message.includes('Password should be at least 6 characters')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (message.includes('Email not confirmed')) return 'E-mail não confirmado. Por favor, verifique seu e-mail (e a pasta de spam).';
  if (message.includes('User already registered')) return 'Este e-mail já está cadastrado.';
  if (message.includes('invalid_credentials')) return 'Credenciais inválidas.';
  if (message.includes('Email rate limit exceeded')) return 'Muitas tentativas. Tente novamente em alguns minutos.';

  // General Errors
  if (message.includes('Network Error') || message.includes('Failed to fetch')) {
    return 'Erro de conexão. Verifique sua internet.';
  }

  // Fallbacks by code if available
  switch (code) {
    case 'PGRST116': return 'Nenhum registro encontrado.';
    case '23505': return 'Este registro já existe.';
    case 'PGRST301': return 'Sessão expirada. Faça login novamente.';
    default: return message || 'Ocorreu um erro inesperado.';
  }
};
