# Como seus dados são tratados

## Princípios
- Menor privilégio
- Isolamento por usuário (RLS)
- Transparência sobre coleta e uso

## O que é armazenado
- Dados financeiros inseridos pelo usuário
- Configurações da conta
- Metadados mínimos de autenticação

## O que não fazemos
- Não vendemos dados de usuários
- Não compartilhamos dados financeiros com terceiros sem consentimento

## Segurança resumida
- Autenticação via Supabase Auth
- Políticas RLS no Postgres
- Possibilidade de backup e restauração pelo próprio usuário

## Direitos do usuário
- Exportar dados
- Solicitar remoção
- Revogar acesso
