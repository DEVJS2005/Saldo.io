# 💰 Saldo.io

Aplicação de finanças pessoais para quem quer clareza mensal sem planilha complexa.

[![Status](https://img.shields.io/badge/status-beta-orange)](#status-real-do-projeto)
[![Licença](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## O problema que resolve

Quem tenta organizar finanças normalmente sofre com:
- ferramentas complicadas;
- baixa consistência de uso;
- pouca visibilidade de vencimentos e do fechamento mensal.

O **Saldo.io** resolve isso com um fluxo simples de contas, cartões, transações e relatórios em um dashboard único.

---

## Vitrine do produto (Fase 1)

| Item | Status | Link |
|---|---|---|
| README impecável | ✅ Entregue | `README.md` |
| Landing page simples (especificação) | ✅ Entregue | [LANDING_PAGE.md](LANDING_PAGE.md) |
| Demo pública com conta sandbox (guia) | ✅ Entregue | [DEMO_SANDBOX.md](DEMO_SANDBOX.md) |
| Pricing page (conteúdo) | ✅ Entregue | [PRICING.pt-BR.md](PRICING.pt-BR.md) |
| Changelog visível | ✅ Entregue | [CHANGELOG.md](CHANGELOG.md) |

---

## Screenshots organizadas

### Dashboard
![Dashboard](./dashboard_screenshot.png)

### Transações
![Transações](./transactions_screenshot.png)

### Relatórios
![Relatórios](./reports_screenshot.png)

### Configurações
![Configurações](./settings_screenshot.png)

---

## Tabela de features

| Área | Feature | Status atual |
|---|---|---|
| Dashboard | Saldo real e projetado | ✅ |
| Transações | Cadastro/edição/exclusão | ✅ |
| Recorrência | Séries mensais | ✅ |
| Parcelamento | Controle por parcelas | ✅ |
| Relatórios | Gráficos e comparativos | ✅ |
| Onboarding guiado | Conta + cartão + dados de exemplo | ✅ |
| Feedback in-app | Coleta estruturada | ✅ MVP entregue |
| Métricas de ativação | cadastro, 1ª conta, 1ª transação, 1º relatório | ✅ MVP entregue |
| Alertas de vencimento | Próximos vencimentos de cartão (7 dias) | ✅ MVP entregue |
| Rotina mensal automática | Checklist de fechamento e pendências | ✅ MVP entregue |
| Resumos inteligentes | Insight textual de desempenho mensal | ✅ MVP entregue |
| Calendário integrado | Atalho para exportação .ics | ✅ MVP entregue |
| Importação de dados | Migração de outros apps | 🕒 Planejado |

---

## Comparação Free vs Premium

| Recurso | Free | Premium |
|---|---:|---:|
| Contas | 1 | Ilimitadas |
| Cartões | 1 | Ilimitados |
| Relatórios avançados | Limitado | Completo |
| Exportação CSV/PDF | ❌ | ✅ |
| Insights inteligentes | Limitado | ✅ |
| Backup em nuvem | ❌ | ✅ |
| Suporte prioritário | ❌ | ✅ |

Referência completa: [PRICING.pt-BR.md](PRICING.pt-BR.md).

---

## Setup local (instruções corretas)

### Pré-requisitos
- Node.js 20+
- npm 10+
- projeto Supabase configurado

### Instalação
```bash
npm install
```

### Variáveis de ambiente
Crie `.env` na raiz:

```env
VITE_SUPABASE_URL=SEU_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=SUA_SUPABASE_ANON_KEY
VITE_PIX_KEY=
VITE_PIX_PAYLOAD=
```

### Rodar projeto
```bash
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

---

## Arquitetura resumida

- Frontend: React 19 + Vite
- Dados e autenticação: Supabase (Auth + Postgres + RPC)
- Estado/cache: TanStack Query + Context API
- Visual: Tailwind CSS + componentes próprios
- Testes: Vitest + Playwright

Fluxo macro:
1. autenticação;
2. leitura/escrita no Supabase;
3. cálculo de resumo financeiro via RPC;
4. renderização de dashboard e relatórios.

---

## Roadmap enxuto por fases

### Fase 2 — validar proposta
- [x] foco em 1 persona (profissional CLT com cartão de crédito)
- [x] onboarding curto (até 3 passos)
- [x] feedback dentro do app (MVP)
- [x] métricas de ativação: cadastro, 1ª conta, 1ª transação, 1º relatório (MVP)

### Fase 3 — fortalecer retenção
- [x] alertas de vencimento (MVP)
- [x] rotina mensal automática (MVP)
- [x] resumos inteligentes (MVP)
- [x] calendário integrado (MVP)
- [ ] importação facilitada de outros apps

### Fase 4 — ganhar confiança
- [x] política de privacidade clara (`/privacy`)
- [x] página “como seus dados são tratados” (`SECURITY_AND_DATA.md`)
- [x] backup/restauração simplificados (guia curto em Configurações)
- [x] página pública de segurança e arquitetura resumida (`/security`)

Documentos de apoio:
- [SECURITY_AND_DATA.md](SECURITY_AND_DATA.md)
- [CHANGELOG.md](CHANGELOG.md)

---

## Status real do projeto

- **Fase atual:** Beta funcional
- **Pronto para uso:** fluxo core de contas, transações, relatórios e dashboard
- **Em evolução:** onboarding, retenção e camadas de confiança pública
- **Próximo marco:** validação de ativação por persona com métricas reais
