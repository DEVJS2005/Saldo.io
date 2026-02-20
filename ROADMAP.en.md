# 🗺️ Saldo.io Roadmap

Track the progress and future plans for **Saldo.io**.

---

## ✅ v0.1.0 - Foundation (Completed)
The beginning of the journey. Focus on structure and offline capability.
- [x] **Project Setup**: React 19, Vite, Tailwind CSS v4.
- [x] **Offline-First Architecture**: Dexie.js (IndexedDB) implementation.
- [x] **Basic Transactions**: Add, list, and delete income and expenses.
- [x] **Initial Dashboard**: Current balance view and recent transactions.
- [x] **Responsive UI**: Adaptive layout for mobile and desktop.

## ✅ v0.2.0 - Organization & Control (Completed)
Tools to better organize finances.
- [x] **Category Management**: Create and delete custom categories (e.g., Food, Transport).
- [x] **Account Management**: Support for multiple accounts (Wallet, Bank, Vouchers, Credit).
- [x] **Initial Reports**: Expenses by Account chart.
- [x] **Maintenance Tools**: Validation and repair of inconsistent data.

## ✅ v0.3.0 - Cloud & SaaS (Completed)
Moving to the cloud and administrative features.
- [x] **Supabase Migration**: Cloud database with authentication.
- [x] **Authentication**: User Login and Registration.
- [x] **Admin Panel**: View registered users and basic metrics.
- [x] **Access Control**: User profiles (Admin vs User).

## ✅ v0.4.0 - Intelligence & Recurrence (Completed)
Improving how we handle time-based events.
- [x] **Smart Editing**: Propagation of edits (only this, future, or all) for recurring transactions.
- [x] **Refined Installments**: Correct logic for installment creation and deletion.
- [x] **Enhanced Filters**: "Except" mode to exclude specific accounts from view.
- [x] **Security**: Protection against deleting accounts with linked transactions.

## ✅ v0.5.0 - SaaS, Stability & Performance (Completed)
Focus on SaaS management, data protection, and robustness.
- [x] **Dual Database**: Clear hybrid structure (Local Offline + Supabase Cloud).
- [x] **Admin Menu**: Visible only to users with permission.
- [x] **User Management**: Activate/Deactivate accounts and check sync permissions.
- [x] **Upload Control**: Specific permission to upload local data to the cloud.
- [x] **Performance**: Lazy loading, Skeletons, and server-side calculations (RPC).
- [x] **Robust Deploy**: Configuration for Vercel/Cloudflare and network failure protection.
- [x] **Authentication Fix**: Resolution of the "infinite limbo" in login/logout and improvement of protected route redirection.

## 📅 v0.6.0 - Vision & Analysis (Planned)
Deep understanding of the numbers.
- [ ] **Flow Reports**: Bar/line charts for monthly expense evolution.
- [ ] **Comparisons**: Income vs Expenses month by month.
- [ ] **Budgets**: Set spending limits by category and track progress.

## 💾 v0.7.0 - Data Freedom (Planned)
Your data belongs to you.
- [ ] **Export**: Generate CSV/JSON files of transactions.
- [ ] **Import**: Restore backup or import from other apps.
- [ ] **Local Backup**: Download full database file.

## 🔮 v0.8.0 - SaaS Administration (Planned)
Advanced tools for business management.
- [ ] **Business Metrics**:
    - [ ] Real Financial Counter (Total balance sum).
    - [ ] Active Users (DAU/MAU).
    - [ ] Transaction Volume (New entries per period).
- [ ] **Advanced Support**:
    - [ ] User Search by Email.
    - [ ] Manual Password Reset (Forced email send).
    - [ ] Action Logs (Security audit).
- [ ] **System Control**:
    - [ ] Maintenance Mode (Lock login except Admin).
    - [ ] Global Announcements (Dashboard message for all).
    - [ ] Database Monitoring (Size and health).

## 🔮 Future
Long-term ideas.
- [ ] **Multi-currency Support**: For travel and international accounts.
- [ ] **Themes**: Manual Light/Dark theme selector (overriding system default).
- [ ] **Integrations**: Open Finance connections (feasibility study).
