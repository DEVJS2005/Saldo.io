# Demo pública (conta sandbox)

## Objetivo
Permitir avaliação rápida do produto sem exigir cadastro inicial.

## Política recomendada
- Ambiente isolado (somente leitura ou reset automático diário)
- Dados fictícios
- Sem dados pessoais reais

## Credenciais de exemplo (substituir em produção)
- Email: `DEMO_EMAIL`
- Senha: `DEMO_PASSWORD`
- Configure os valores reais via variáveis de ambiente ou secret manager; não documente senhas válidas no repositório.

## Regras de segurança
- Bloquear exportações sensíveis na sandbox
- Limitar ações administrativas
- Executar reset periódico da base demo
