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

## ✅ v0.6.0 - Vision & Analysis (Completed)
Deep understanding of the numbers.
- [x] **Flow Reports**: Bar/line charts for monthly expense evolution.
- [x] **Comparisons**: Income vs Expenses month by month.
- [x] **Budgets**: Set spending limits by category and track progress.

## ✅ v0.7.0 - Freedom & Stability (Completed)
Secure data and unbreakable code.
- [x] **Export**: Generate CSV/JSON files of transactions.
- [x] **Import**: Restore backup or import from other apps.
- [x] **Local Backup**: Download full database file.
- [x] **Automated Testing (E2E & Unit)**: Vitest and Playwright setup to shield the interface against regressions and loading loops.

## ✅ v0.8.0 - SaaS Administration (Completed)
Advanced tools for business management.
- [x] **Business Metrics**:
    - [x] Real Financial Counter (Total balance sum).
    - [x] Active Users (DAU/MAU).
    - [x] Transaction Volume (New entries per period).
- [x] **Advanced Support**:
    - [x] User Search by Email.
    - [x] Manual Password Reset (Forced email and internal settings).
    - [x] Action Logs (Security audit).
    - [x] **Public Test Account**: One-click Demo Login with automated data reset.
- [x] **System Control**:
    - [x] Maintenance Mode (Lock login except Admin).
    - [x] Global Announcements (Dashboard message for all).
    - [ ] Database Monitoring (Size and health).

## ✅ v1.0.0 - Global Experience & Onboarding (Completed)
Final UI optimization and global reach of the product.
- [x] **PWA (Progressive Web App)**: Mobile and desktop installation for use as a native app, fast and offline-ready.
- [x] **Themes**: Manual Light/Dark theme selector saved locally.
- [x] **Internationalization (i18n)**: Dynamic support for multiple languages (Portuguese, English, Spanish).
- [x] **System Tour**: Interactive Onboarding integration (React Joyride) to present the main screens.

## 🔮 Future Triage & New Implementations
Ideas and integrations focused on expanding the app's horizons.

### Short/Medium Term
- [ ] **Advanced Credit Card Management**: Closing dates, due dates, real-time limits, and invoices.
- [ ] **Tags or "Cost Centers"**: Cross-categorization for events (e.g., #SPTrip, #Carnival2026).
- [ ] **Subscriptions Manager**: Dedicated dashboard for recurring expenses with savings insights.
- [ ] **Alerts & Notifications Automation**: Due date reminders and budget ceiling alerts.

### Long Term (Competitive Advantages)
- [ ] **Shared Finances & Bill Splitting**: Splitwise style (split transactional bills, track who owes who, family dashboard).
- [ ] **Net Worth & Investments Evolution**: Net worth projection mixing checking balance with investments/savings.
- [ ] **Multi-currency Support**: For travel and international accounts management.
- [ ] **Smart Integrations**: Banking via Open Finance (fluid import) and OCR Automation (receipt scanning).
- [ ] **Financial Goals**: "Safeboxes" to separate money from the main balance focusing on specific objectives (e.g., Vacation, New Car).
