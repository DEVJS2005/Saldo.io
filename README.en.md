# 💰 Saldo.io

> **Smart, secure, and hybrid financial control (SaaS).**
> *Powered by **Antigravity - Gemini 3 Pro***

**Saldo.io** is a modern personal finance management platform that combines the speed of a local app with the security of the cloud. Built with **React 19** and **Supabase**, it offers a premium experience to organize your finances.

![Status](https://img.shields.io/badge/Status-v1.0.0_(Stable)-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white) ![Coverage](https://img.shields.io/badge/Coverage-min_70%25-brightgreen)

---

## ✨ Key Features

### 🔄 Hybrid Architecture (Dual Database)
- **Offline Mode (Free)**: Your data is saved only on your device (IndexedDB). Total privacy, zero cost.
- **Cloud Mode (Premium)**: Automatic synchronization with the cloud (Supabase) to access from anywhere.

### 📊 Complete Management
- **Intuitive Dashboard**: Clear view of forecasts, current balance, income, and expenses.
- **Smart Transactions**:
  - Automatic installments.
  - Recurrences (fixed or variable) with edit propagation.
- **Multiple Accounts**: Wallet, Banks, Vouchers, and Credit Cards (with invoice control).

### 🛡️ Access Security
- **Robust Authentication**: Secure login via email and state management to prevent loading failures (infinite limbo).
- **Data Protection**: RLS (Row Level Security) policies ensure that only you access your data.
- **Fail-Safe**: Secure logout system, route protection against history loops, and resilience to connection loss.

### ⚙️ Administrative Panel (SaaS)
- User and permissions management.
- Access control to Premium resources (Sync).
- System audit and metrics (Changelog, Database Health, Audit Logs).

### 🌐 Global Experience & Onboarding
- **PWA (Progressive Web App)**: Installable on Mobile/Desktop, responsive and offline-ready.
- **Internationalization (i18n)**: Fully translated to English, Spanish and Portuguese.
- **Themes**: System-based or manual Dark/Light mode toggle.
- **Product Tour**: Automated interactive tour for new users (React Joyride).

---

## 🛠️ Tech Stack

This project uses the most modern tools in the web ecosystem:

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons)
- **Local Data**: [Dexie.js](https://dexie.org/) (IndexedDB Wrapper)
- **Backend / Cloud**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, RPC)
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) (E2E)
- **Deploy**: Vercel / Cloudflare Pages

---

## 🚀 How to Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/seu-usuario/saldo.io.git
   cd saldo.io
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root and add your Supabase keys:
   ```env
   VITE_SUPABASE_URL=your_url_here
   VITE_SUPABASE_ANON_KEY=your_anonymous_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

---

## 🗺️ Roadmap

Check out our [Detailed Roadmap](ROADMAP.en.md) to see the future plans, including:
- [ ] Advanced Reports and Charts
- [ ] Progressive Web App (PWA) Support
- [ ] Data Export

---

## 🤝 Contribution

Contributions are welcome! Feel free to open **Issues** or submit **Pull Requests**.

---

Developed with 💜 by **You**.
