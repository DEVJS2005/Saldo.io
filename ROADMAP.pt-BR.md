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

## ✅ v0.3.0 - Cloud & SaaS (Concluído)
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

## ✅ v0.6.0 - Visão e Análise (Concluído)
Entendendo os números com profundidade.
- [x] **Relatórios de Fluxo**: Gráficos de barra/linha para evolução mensal de gastos.
- [x] **Comparativos**: Receitas vs Despesas mês a mês.
- [x] **Orçamentos (Budgets)**: Definir tetos de gastos por categoria e acompanhar o progresso.

## ✅ v0.7.0 - Liberdade e Estabilidade (Concluído)
Seus dados seguros e código inquebrável.
- [x] **Exportação**: Gerar arquivos CSV/JSON das transações.
- [x] **Importação**: Restaurar backup ou importar de outros apps.
- [x] **Backup Local**: Baixar arquivo completo do banco de dados.
- [x] **Testes Automatizados (E2E & Unitários)**: Vitest e Playwright configurados para blindar a interface contra regressões e loops de carregamento.

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

## ✅ v1.0.0 - Experiência Global e Onboarding (Concluído)
Otimização final de interface e alcance global do produto.
- [x] **PWA (Progressive Web App)**: Instalação no celular e desktop para uso como app nativo, rápido e offline-ready.
- [x] **Temas**: Seletor manual de tema Claro/Escuro salvo localmente.
- [x] **Internacionalização (i18n)**: Suporte dinâmico para múltiplos idiomas (Português, Inglês, Espanhol).
- [x] **Tour do Sistema**: Integração de Onboarding interativo (React Joyride) para apresentação das telas principais.

## ✅ v1.1.0 - Hardening de Segurança (Concluído)
Auditoria completa de segurança e remediação de vulnerabilidades em toda a stack.
- [x] **Proteção de Chave de API de IA (SEC-01)**: Migrada de `localStorage` para Edge Function Supabase (`ai-proxy`). Chaves armazenadas como secrets server-side — nunca expostas ao cliente.
- [x] **Remoção de Credencial Hardcoded (SEC-02)**: Chave da API Stitch removida do código-fonte. Movida para `process.env.STITCH_API_KEY` com documentação no `.env.example`.
- [x] **Endurecimento da Content Security Policy (SEC-03)**: Removidos `unsafe-inline` e `unsafe-eval` do CSP de produção. Domínios Pusher não utilizados removidos. Configurações dev/prod separadas. Pasta `stitch_screens` expurgada do histórico Git.
- [x] **Proteção Admin Server-Side (SEC-04)**: Todas as RPCs sensíveis (`get_admin_metrics`, `get_db_health_metrics`, `revoke_other_sessions`) agora validam `auth.uid()` e `role = 'admin'` via `SECURITY DEFINER`. Uso consistente de `usePermissions()` antes de ações administrativas.
- [x] **Padronização do Soft Delete (SEC-05)**: Criada View PostgreSQL `active_transactions` com filtro `deleted_at IS NULL` e RLS. Todas as queries de transações migradas para usar a view.
- [x] **Proteção contra Reset Destrutivo (SEC-06)**: Confirmação em duas etapas exigindo digitação de "DELETAR TUDO". Backup JSON automático gerado antes do reset. Evento registrado em `audit_logs`.
- [x] **Correção de Bug na Revogação de Sessão (SEC-07)**: Removido filtro duplicado (`.eq` + `.is`) em `useSessions.js`. Tratamento de erro adequado com feedback ao usuário.
- [x] **Externalização da Chave PIX (SEC-08)**: Chave PIX e UUID hardcoded movidos de `Layout.jsx` para `src/data/constants.js`.
- [x] **Rate Limiting (ARCH-01)**: Algoritmo Token Bucket implementado nativamente no Supabase via RPC `check_rate_limit`. Aplicado em `get_financial_summary` e `revoke_other_sessions`.
- [x] **Audit Log Centralizado (ARCH-02)**: Tabela `audit_logs` com triggers PostgreSQL registrando automaticamente mutações destrutivas (deleção, mudança de role, revogação de sessão).
- [x] **Paginação de Transações (ARCH-03)**: Paginação baseada em cursor implementada no `useBudget` para usuários com histórico extenso.
- [x] **Conformidade LGPD (ARCH-04)**: Log de aceite de termos com data e versão. Fluxo de direito ao esquecimento cobrindo logs e dados de sessão. Política de privacidade acessível in-app nas Configurações.

## 🚀 v1.2.0 - Integração com Calendário (Em Progresso)
Levando os vencimentos financeiros para a agenda diária do usuário.
- [x] **Dias de Fechamento e Vencimento do Cartão (CAL-01)**: Adicionados campos `closing_day` e `due_day` às contas de cartão de crédito. UI atualizada em Configurações com inputs validados (range 1–31).
- [x] **Edge Function de Exportação iCal (CAL-02)**: Edge Function Supabase `generate-ical` gerando arquivos `.ics` conformes com RFC 5545. Transações de cartão de crédito agrupadas em evento único "💳 Fatura [Cartão] - Mês/Ano" na data de vencimento com descrição itemizada. Transações de conta corrente exportadas como eventos individuais com valor na descrição. Lembretes VALARM incluídos (3 dias antes da fatura, 1 dia antes de transações regulares).
- [x] **Seção Calendário nas Configurações (CAL-03)**: Nova seção "Calendário" em Configurações. Toggles para sincronização de cartão de crédito e conta corrente. MonthYearSelector para seleção do mês. Botões "Exportar Mês Completo" e "Exportar Selecionados" com checkboxes individuais por transação.
- [ ] **Integração OAuth2 com Google Calendar (CAL-04)**: Sincronização bidirecional direta via Google Calendar API. Criação/atualização automática de eventos ao adicionar transações. Notificações via Gmail para vencimentos próximos.

## 🔮 Futuro Triagem & Novas Implementações
Ideias e integrações focadas em expandir os horizontes do app.

### Curto/Médio Prazo
- [ ] **Tags ou "Centros de Custo"**: Categorização cruzada para eventos (ex: #ViagemSP, #Carnaval2026).
- [ ] **Gerenciador de Assinaturas (Subscriptions)**: Dashboard dedicado para gastos recorrentes com insights de economia.
- [ ] **Automação de Alertas e Notificações**: Lembretes de vencimento e alertas de limite de orçamento (Budgets).

### Longo Prazo (Diferenciais Competitivos)
- [ ] **Finanças Compartilhadas e Divisão de Contas**: Estilo Splitwise (rachar contas transacionais, gerir quem deve quem, painel família).
- [ ] **Evolução Patrimonial (Net Worth e Investimentos)**: Projeção de patrimônio líquido cruzando saldo com investimentos/poupança.
- [ ] **Suporte Multi-moeda**: Para viagens e gestão de contas internacionais.
- [ ] **Integrações Inteligentes**: Bancos via Open Finance (importação fluida) e Automação via OCR (leitura de notas fiscais).
- [ ] **Metas Financeiras (Goals)**: "Caixinhas" para separar dinheiro do saldo principal com foco em objetivos (ex: Viagem, Carro).