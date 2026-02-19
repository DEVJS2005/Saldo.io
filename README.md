# 💰 Saldo.io

> **Smart, Secure, and Hybrid Financial Control (SaaS).**
> *Built with **Antigravity - Gemini 3 Pro***

**Saldo.io** is a modern personal finance platform that combines the speed of a local app with the security of the cloud. Built with **React 19** and **Supabase**, it offers a premium experience for organizing your finances.

![Status](https://img.shields.io/badge/Status-v0.5.0_(Stable)-success) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Key Features

### 🔄 Hybrid Architecture (Dual Database)
- **Offline Mode (Free)**: Your data is stored only on your device (IndexedDB). Total privacy, zero cost.
- **Cloud Mode (Premium)**: Automatic sync with the cloud (Supabase) for access from anywhere.

### 📊 Complete Management
- **Intuitive Dashboard**: Clear view of projections, current balance, income, and expenses.
- **Smart Transactions**:
  - Automatic installments.
  - Recurring transactions (fixed or variable) with edit propagation.
- **Multiple Accounts**: Wallet, Bank, Vouchers, and Credit Cards (with invoice tracking).

### 🛡️ Access Security
- **Robust Authentication**: Secure login via email.
- **Data Protection**: RLS (Row Level Security) policies ensure that only you can access your data.
- **Fail-Safe**: Secure logout system and protection against connection loss.

### ⚙️ Admin Panel (SaaS)
- User and permission management.
- Access control for Premium features (Sync).
- System audit and metrics.

---

## 🛠️ Tech Stack

This project uses the latest in the web ecosystem:

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons)
- **Local Data**: [Dexie.js](https://dexie.org/) (IndexedDB Wrapper)
- **Backend / Cloud**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, RPC)
- **Deploy**: Vercel / Cloudflare Pages

---

## 🚀 How to Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/saldo.io.git
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
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

---

## 🗺️ Roadmap

Check out our [Detailed Roadmap](ROADMAP.en.md) to see future plans, including:
- [ ] Advanced Reports & Charts
- [ ] Bank Integration (Open Finance)
- [ ] Data Export

---

## 🤝 Contribution

Contributions are welcome! Feel free to open **Issues** or submit **Pull Requests**.

---

Developed with 💜 by **You**.
