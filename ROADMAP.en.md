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
    - [x] Database Monitoring (Size, health, growth and indexes with visual UI).

## ✅ v0.9.0 - Quality, CI/CD & Security (Completed)
Production reliability and layered data protection.
- [x] **CI/CD (GitHub Actions)**: Pipeline with mandatory Lint, automatic Build and Tests — merge blocked without passing checks.
- [x] **Test Coverage**: Coverage report with minimum 70% threshold (statements, branches, functions, lines).
- [x] **CSP Headers**: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options and Referrer-Policy via Vercel.
- [x] **Backend Permission Validation**: RPC functions (`check_user_permissions`, `check_admin_access`, `check_sync_access`) with `SECURITY DEFINER` — immune to client-side manipulation.
- [x] **`usePermissions` Hook**: React layer to securely consume permission RPCs before sensitive actions.
- [x] **`audit_logs` Table**: Immutable (append-only) log of all admin panel actions, protected by RLS.
- [x] **RLS Policies**: Security policies for `profiles`, `transactions`, `categories` and `accounts` tables.
- [x] **Security Fix**: Removed `localStorage` fallback for `role/canSync` — timeout now assumes minimum permission level.

## ✅ v1.0.0 - Global Experience & Onboarding (Completed)
Final UI optimization and global reach of the product.
- [x] **PWA (Progressive Web App)**: Mobile and desktop installation for use as a native app, fast and offline-ready.
- [x] **Themes**: Manual Light/Dark theme selector saved locally.
- [x] **Internationalization (i18n)**: Dynamic support for multiple languages (Portuguese, English, Spanish).
- [x] **System Tour**: Interactive Onboarding integration (React Joyride) to present the main screens.

## ✅ v1.1.0 - Security Hardening (Completed)
Full security audit and vulnerability remediation across the entire stack.
- [x] **AI API Key Protection (SEC-01)**: Migrated from `localStorage` to Supabase Edge Function (`ai-proxy`). API keys stored as server-side secrets — never exposed to the client.
- [x] **Hardcoded Credential Removal (SEC-02)**: Removed Stitch API key from source code. Moved to `process.env.STITCH_API_KEY` with `.env.example` documentation.
- [x] **Content Security Policy Hardening (SEC-03)**: Removed `unsafe-inline` and `unsafe-eval` from production CSP. Cleaned unused Pusher domains. Separated dev/prod configurations. Purged untracked `stitch_screens` folder from Git history.
- [x] **Server-Side Admin Protection (SEC-04)**: All sensitive RPCs (`get_admin_metrics`, `get_db_health_metrics`, `revoke_other_sessions`) now validate `auth.uid()` and `role = 'admin'` via `SECURITY DEFINER`. Consistent use of `usePermissions()` before administrative actions.
- [x] **Soft Delete Standardization (SEC-05)**: Created `active_transactions` PostgreSQL View with `deleted_at IS NULL` filter and RLS. All transaction queries migrated to use the view.
- [x] **Destructive Reset Protection (SEC-06)**: Two-step confirmation requiring user to type "DELETAR TUDO". Automatic JSON backup generated before reset. Reset event registered in `audit_logs`.
- [x] **Session Revocation Bug Fix (SEC-07)**: Removed duplicate filter (`.eq` + `.is`) in `useSessions.js`. Added proper error handling with user feedback.
- [x] **PIX Key Externalization (SEC-08)**: Moved hardcoded PIX key and UUID from `Layout.jsx` to `src/data/constants.js`.
- [x] **Rate Limiting (ARCH-01)**: Token Bucket algorithm implemented natively in Supabase via `check_rate_limit` RPC. Applied to `get_financial_summary` and `revoke_other_sessions`.
- [x] **Centralized Audit Log (ARCH-02)**: `audit_logs` table with PostgreSQL triggers automatically recording destructive mutations (delete, role change, session revocation).
- [x] **Transaction Pagination (ARCH-03)**: Cursor-based pagination implemented in `useBudget` for users with extensive history.
- [x] **LGPD Compliance (ARCH-04)**: Terms acceptance log with date and version. Right to erasure flow covering logs and session data. In-app privacy policy accessible from Settings.

## 🚀 v1.2.0 - Calendar Integration (In Progress)
Bringing financial deadlines into the user's daily agenda.
- [x] **Credit Card Due & Closing Days (CAL-01)**: Added `closing_day` and `due_day` fields to credit card accounts. UI updated in Settings with validated inputs (range 1–31).
- [x] **iCal Export Edge Function (CAL-02)**: Supabase Edge Function `generate-ical` producing RFC 5545 compliant `.ics` files. Credit card transactions grouped into a single "💳 Fatura [Card] - Month/Year" event on the due date with itemized description. Regular account transactions exported as individual events with amount in description. VALARM reminders included (3 days before invoice, 1 day before regular transactions).
- [x] **Calendar Settings Section (CAL-03)**: New "Calendar" section in Settings. Toggles for credit card and checking account sync. MonthYearSelector for month selection. "Export Full Month" and "Export Selected" buttons with individual transaction checkboxes.
- [ ] **Google Calendar OAuth2 Integration (CAL-04)**: Direct two-way sync via Google Calendar API. Automatic event creation/update when transactions are added. Notifications via Gmail for upcoming due dates.

## 🔮 Future Triage & New Implementations
Ideas and integrations focused on expanding the app's horizons.

### Short/Medium Term
- [ ] **Tags or "Cost Centers"**: Cross-categorization for events (e.g., #SPTrip, #Carnival2026).
- [ ] **Subscriptions Manager**: Dedicated dashboard for recurring expenses with savings insights.
- [ ] **Alerts & Notifications Automation**: Due date reminders and budget ceiling alerts.

### Long Term (Competitive Advantages)
- [ ] **Shared Finances & Bill Splitting**: Splitwise style (split transactional bills, track who owes who, family dashboard).
- [ ] **Net Worth & Investments Evolution**: Net worth projection mixing checking balance with investments/savings.
- [ ] **Multi-currency Support**: For travel and international accounts management.
- [ ] **Smart Integrations**: Banking via Open Finance (fluid import) and OCR Automation (receipt scanning).
- [ ] **Financial Goals**: "Safeboxes" to separate money from the main balance focusing on specific objectives (e.g., Vacation, New Car).