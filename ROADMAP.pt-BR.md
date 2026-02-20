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

## 💾 v0.7.0 - Liberdade de Dados (Planejado)
Seus dados são seus.
- [ ] **Exportação**: Gerar arquivos CSV/JSON das transações.
- [ ] **Importação**: Restaurar backup ou importar de outros apps.
- [ ] **Backup Local**: Baixar arquivo completo do banco de dados.

## 🔮 v0.8.0 - Administração SaaS (Planejado)
Ferramentas avançadas para gestão do negócio.
- [ ] **Métricas de Negócio**:
    - [ ] Contador Financeiro Real (Soma total dos saldos).
    - [ ] Usuários Ativos (DAU/MAU).
    - [ ] Volume de Transações (Novas entradas por período).
- [ ] **Suporte Avançado**:
    - [ ] Busca de usuários por E-mail.
    - [ ] Reset de Senha Manual (Envio de e-mail forçado).
    - [ ] Logs de Ação (Auditoria de segurança).
    - [ ] **Conta de Teste Pública**: Login sem verificação de e-mail com reset de senha permitido.
- [ ] **Controle do Sistema**:
    - [ ] Modo Manutenção (Travar login exceto Admin).
    - [ ] Avisos Globais (Mensagem no dashboard de todos).
    - [ ] Monitoramento de Banco de Dados (Tamanho e saúde).

## 🔮 Futuro
Ideias para longo prazo.
- [ ] **Suporte Multi-moeda**: Para viagens e contas internacionais.
- [ ] **Temas**: Seletor manual de tema Claro/Escuro (além do sistema).
- [ ] **Integrações**: Bancos via Open Finance (estudo de viabilidade).
