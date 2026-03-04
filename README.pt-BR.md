# 💰 Saldo.io

> **Controle financeiro inteligente, seguro e híbrido (SaaS).**
> *Desenvolvido com **Antigravity - Gemini 3 Pro***

O **Saldo.io** é uma plataforma moderna de gestão financeira pessoal que combina a velocidade de um app local com a segurança da nuvem. Desenvolvido com **React 19** e **Supabase**, ele oferece uma experiência premium para organizar suas finanças.

![Status](https://img.shields.io/badge/Status-v1.0.0_(Estável)-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white) ![Coverage](https://img.shields.io/badge/Cobertura-70%25_mín-brightgreen)

---

## ✨ Principais Funcionalidades

### 🔄 Arquitetura Híbrida (Dual Database)
- **Modo Offline (Grátis)**: Seus dados ficam salvos apenas no seu dispositivo (IndexedDB). Privacidade total, zero custo.
- **Modo Nuvem (Premium)**: Sincronização automática com a nuvem (Supabase) para acessar de qualquer lugar.

### 📊 Gestão Completa
- **Dashboard Intuitivo**: Visão clara de previsões, saldo atual, receitas e despesas.
- **Transações Inteligentes**:
  - Parcelamentos automáticos.
  - Recorrências (fixas ou variáveis) com propagação de edições.
- **Múltiplas Contas**: Carteira, Bancos, Vale Alimentação e Cartões de Crédito (com controle de faturas).

### 🛡️ Segurança de Acesso
- **Autenticação Robusta**: Login seguro via e-mail e tratamento de estados para evitar falhas de carregamento (limbo infinito).
- **Proteção de Dados**: Políticas RLS (Row Level Security) garantem que apenas você acesse seus dados.
- **Validação no Backend**: Funções RPC com `SECURITY DEFINER` validam permissões diretamente no banco — imunes a manipulação client-side.
- **CSP Headers**: Content-Security-Policy e headers de segurança aplicados em produção via Vercel.
- **Anti-Falhas**: Sistema de logout seguro, proteção de rotas contra loops de histórico e resiliência à perda de conexão.

### ⚙️ Painel Administrativo (SaaS)
- Gestão de usuários e permissões com busca avançada.
- Controle de acesso a recursos Premium (Sync).
- Métricas de Sistema: Acompanhamento de Saldo Total, Volumes e Usuários Ativos.
- Suporte VIP: Reset de senha forçado (via admin) e conta de Demonstração pública.
- Modo de Manutenção (Trava do sistema).
- Central de Avisos e Notificações (Changelog).
- **Auditoria**: Tabela `audit_logs` imutável (append-only) registra toda ação do painel admin.

### 🌐 Experiência Global e Onboarding
- **PWA (Progressive Web App)**: Instalável no Celular/Desktop para uso nativo, rápido e offline-ready.
- **Temas**: Seletor manual para forçar Tema Claro / Escuro.
- **Internacionalização (i18n)**: Suporte dinâmico para múltiplos idiomas (Português, Inglês, Espanhol).

### 🧹 Qualidade e CI/CD
- **GitHub Actions**: Pipeline automático (Lint → Build + Testes) em todo PR e push.
- **Cobertura de Código**: Threshold mínimo de 70% via Vitest + V8.
- **Merge Protegido**: Branch `main` só aceita merges com todos os checks passando.

---

## 🛠️ Tecnologias Utilizadas

Este projeto utiliza o que há de mais moderno no ecossistema web:

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Ícones)
- **Dados Locais**: [Dexie.js](https://dexie.org/) (IndexedDB Wrapper)
- **Backend / Nuvem**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, RPC)
- **Testes**: [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/) (E2E)
- **CI/CD**: [GitHub Actions](https://github.com/features/actions)
- **Deploy**: Vercel / Cloudflare Pages

---

## 🚀 Como Rodar Localmente

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/saldo.io.git
   cd saldo.io
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz e adicione suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

---

## 🗺️ Roadmap

Confira nosso [Roadmap Detalhado](ROADMAP.pt-BR.md) para ver os planos para o futuro, incluindo:
- [ ] Relatórios Avançados e Gráficos
- [ ] Integração Bancária (Open Finance)
- [ ] Exportação de Dados

---

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir **Issues** ou enviar **Pull Requests**.

---

Desenvolvido com 💜 por **Você**.
