# 🗺️ Roadmap do Saldo.io

Acompanhe o progresso e os planos futuros para o **Saldo.io**.

---

## ✅ v0.1.0 - Fundação (Concluído)
O início da jornada. Foco em estrutura e funcionamento offline.
- [x] **Configuração do Projeto**: React 19, Vite, Tailwind CSS v4.
- [x] **Arquitetura Offline-First**: Implementação do Dexie.js (IndexedDB).
- [x] **Transações Básicas**: Adicionar, listar e remover receitas e despesas.
- [x] **Dashboard Inicial**: Visualização de saldo atual e últimas movimentações.
- [x] **UI Responsiva**: Layout adaptável para mobile e desktop.

## ✅ v0.2.0 - Organização e Controle (Concluído)
Ferramentas para organizar melhor as finanças.
- [x] **Gestão de Categorias**: Criação e remoção de categorias personalizadas (ex: Alimentação, Transporte).
- [x] **Gestão de Contas**: Controle de múltiplas contas (Carteira, Banco, Vale, Crédito).
- [x] **Relatórios Iniciais**: Gráfico de despesas por conta.
- [x] **Ferramentas de Manutenção**: Validação e reparo de dados inconsistentes.

## 🚀 v0.3.0 - Cloud & SaaS (Em Progresso)
Mudança para nuvem e funcionalidades administrativas.
- [x] **Migração Supabase**: Banco de dados na nuvem com autenticação.
- [x] **Autenticação**: Login e Registro de usuários.
- [x] **Painel Admin**: Visualizar usuários cadastrados e métricas básicas.
- [x] **Controle de Acesso**: Perfis de usuário (Admin vs User).

## ✅ v0.4.0 - Inteligência e Recorrência (Concluído)
Melhorando a forma como lidamos com o tempo.
- [x] **Edição Inteligente**: Propagação de edições (apenas esta, futuras ou todas) para transações recorrentes.
- [x] **Parcelamentos Refinados**: Lógica correta de criação e exclusão de parcelas.
- [x] **Filtros Aprimorados**: Modo "Exceto" para excluir contas específicas da visualização.
- [x] **Segurança**: Proteção contra exclusão de contas com transações vinculadas.

## ✅ v0.5.0 - SaaS, Estabilidade e Performance (Concluído)
Foco na gestão do sistema SaaS, proteção de dados e robustez.
- [x] **Dual Database**: Estrutura híbrida clara (Local Offline + Supabase Cloud).
- [x] **Menu Admin**: Visível apenas para usuários com permissão.
- [x] **Gestão de Usuários**: Ativar/Desativar contas e verificar permissões de sync.
- [x] **Controle de Upload**: Permissão específica para enviar dados locais para a nuvem.
- [x] **Performance**: Lazy loading, Skeletons e cálculos no servidor (RPC).
- [x] **Deploy Robusto**: Configuração para Vercel/Cloudflare e proteção contra falhas de rede.
- [x] **Correção de Autenticação**: Resolução do "limbo infinito" no login/logout e aprimoramento do redirecionamento de rotas protegidas.

## 🚧 v0.6.0 - Visão e Análise (Planejado)
Entendendo os números com profundidade.
- [ ] **Relatórios de Fluxo**: Gráficos de barra/linha para evolução mensal de gastos.
- [ ] **Comparativos**: Receitas vs Despesas mês a mês.
- [ ] **Orçamentos (Budgets)**: Definir tetos de gastos por categoria e acompanhar o progresso.
- [ ] **PWA (Progressive Web App)**: Permitir instalação no celular para uso 100% offline, sem depender das lojas de aplicativos.

## 💾 v0.7.0 - Liberdade e Estabilidade (Planejado)
Seus dados seguros e código inquebrável.
- [ ] **Exportação**: Gerar arquivos CSV/JSON das transações.
- [ ] **Importação**: Restaurar backup ou importar de outros apps.
- [ ] **Backup Local**: Baixar arquivo completo do banco de dados.
- [x] **Testes Automatizados (Unitários)**: Vitest com cobertura mínima de 70% — transações, parcelamentos, recorrências e migração de dados cobertos.

## ✅ v0.8.0 - Administração SaaS (Concluído)
Ferramentas avançadas para gestão do negócio.
- [x] **Métricas de Negócio**:
    - [x] Contador Financeiro Real (Soma total dos saldos).
    - [x] Usuários Ativos (DAU/MAU).
    - [x] Volume de Transações (Novas entradas por período).
- [x] **Suporte Avançado**:
    - [x] Busca de usuários por E-mail.
    - [x] Reset de Senha Manual (Envio de e-mail forçado e painel interno).
    - [x] Logs de Ação (Auditoria de segurança).
    - [x] **Conta de Teste Pública**: Login automático para Demonstração com reset.
- [x] **Controle do Sistema**:
    - [x] Modo Manutenção (Travar login exceto Admin).
    - [x] Avisos Globais (Mensagem no dashboard de todos - Changelog).
    - [x] Monitoramento de Banco de Dados (Tamanho, saúde, crescimento e índices com UI visual).

## ✅ v0.9.0 - Qualidade, CI/CD e Segurança (Concluído)
Confiabilidade de produção e proteção de dados em camadas.
- [x] **CI/CD (GitHub Actions)**: Pipeline com Lint obrigatório, Build automático e Testes — merge bloqueado sem checks passando.
- [x] **Cobertura de Testes**: Relatório de cobertura com threshold mínimo de 70% (statements, branches, functions, lines).
- [x] **CSP Headers**: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options e Referrer-Policy via Vercel.
- [x] **Validação de Permissões no Backend**: Funções RPC (`check_user_permissions`, `check_admin_access`, `check_sync_access`) com `SECURITY DEFINER` — imunes a manipulação client-side.
- [x] **Hook `usePermissions`**: Camada React para consumir as RPCs de permissão de forma segura antes de ações sensíveis.
- [x] **Tabela `audit_logs`**: Log imutável (append-only) de todas as ações do painel admin, protegido por RLS.
- [x] **RLS Policies**: Políticas de segurança para as tabelas `profiles`, `transactions`, `categories` e `accounts`.
- [x] **Correção de Segurança**: Removido fallback de `localStorage` para `role/canSync` — timeout agora assume nível mínimo de permissão.

## 🔮 Futuro
Ideias para longo prazo.
- [ ] **Suporte Multi-moeda**: Para viagens e contas internacionais.
- [ ] **Temas**: Seletor manual de tema Claro/Escuro (além do sistema).
- [ ] **Integrações**: Bancos via Open Finance (estudo de viabilidade).
- [ ] **Metas Financeiras (Goals)**: "Caixinhas" para separar dinheiro do saldo principal com foco em objetivos (ex: Viagem, Carro).
- [ ] **Internacionalização (i18n)**: Suporte dinâmico para múltiplos idiomas (Inglês, Espanhol, etc) na interface do usuário.
