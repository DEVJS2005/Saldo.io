# Demo pública (conta sandbox)

## Objetivo
Permitir avaliação rápida do produto sem exigir cadastro inicial.

## Política recomendada
- Ambiente isolado (somente leitura ou reset automático diário)
- Dados fictícios
- Sem dados pessoais reais

## Credenciais de exemplo
- Email: `DEMO_EMAIL`
- Senha: `DEMO_PASSWORD`
- Configure os valores reais via variáveis de ambiente ou secret manager; não documente credenciais concretas.

## Regras de segurança
- Bloquear exportações sensíveis na sandbox
- Limitar ações administrativas
- Executar reset periódico da base demo
- Rotacionar ou resetar automaticamente as credenciais da conta demo
