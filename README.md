# ExpenseFlow — Personal Expense Tracker & Financial Dashboard

ExpenseFlow is a responsive personal finance dashboard built with React 19, Vite, Tailwind CSS, and Lucide icons. It provides real-time income and expense logging, interactive SVG analytics, monthly comparisons, transaction filters, and CSV export capabilities.

## Features

- **Financial Overview**: Real-time Total Balance, Total Income, and Total Expenses with currency formatting and positive/negative indicators.
- **Income vs. Spending Progress**: Visual ratio indicator showing percentage spent with over-budget alerts.
- **Interactive SVG Donut Chart**: Native SVG chart displaying category spending distributions with tooltips and center total metrics.
- **Monthly Performance Reports**: Month-by-month financial summaries, savings rates, and prior-month comparative benchmarks.
- **Category Breakdown**: Proportional horizontal progress bars ranked by spending volume with dedicated category icons.
- **Peak Expense Spotlight**: Dynamic identification of the highest spending category for any selected month.
- **Complete Transaction Ledger**:
  - Live real-time search by description or category.
  - Type filter (All, Income, Expense).
  - Category filter with dynamic options.
  - Date period filter (All Time, Current Month, Previous Month, Custom Date Range).
  - Multi-attribute sorting (Newest, Oldest, Highest, Lowest).
  - Accessible deletion with confirmation modal.
- **CSV Data Export**: One-click export with UTF-8 BOM, escaped values, and CSV formula injection protection.
- **Theme Modes**: Seamless Light and Dark mode switching with persisted theme preference and system preference detection.
- **Full-Stack Real-Time Engine (Express + Vite)**:
  - Express backend running on port 3000 with Server-Sent Events (SSE) live broadcast (`/api/realtime`).
  - Bi-directional instant data updates across all open tabs, windows, and devices.
  - REST endpoints (`/api/health`, `/api/transactions`) with schema validation and live client count tracking.
  - Interactive round-trip latency ping test in Settings.
- **Firebase Cloud Synchronization & Google Auth**:
  - Seamless Google Sign-In with real-time Firestore database synchronization (`ai-studio-expenseflowperso-88ab2469-f43b-4159-a65d-ae9424b7f535`).
  - Multi-device data sync with private per-user document isolation under `/users/{userId}/transactions`.
  - Offline-first fallback: maintains local storage continuity when disconnected.
- **Display Currency Preferences**: Support for Indian Rupee (INR ₹) default, US Dollar (USD $), Euro (EUR €), British Pound (GBP £), Japanese Yen (JPY ¥), Canadian Dollar (CAD $), and Australian Dollar (AUD $).
- **Accessible & Responsive**: Keyboard navigable dialogs, WCAG AA color contrast, tabular numerals (`tabular-nums`), and zero horizontal overflow across mobile (320px–420px), tablet, and desktop viewports.

## Local Storage & Data Privacy Notice

**Important Note on Data Persistence**:
All transaction data is stored locally in the browser profile using HTML5 `localStorage` under the key `expenseflow_transactions_v1`. 

- **Local to Browser Profile**: Transactions are saved directly on your local device within the current browser profile.
- **No Cloud Synchronization**: Data is not synced across multiple devices or private browser windows.
- **No External Servers**: ExpenseFlow operates 100% client-side with zero telemetry, remote databases, or external banking connections.
- **Backup**: Use the **Export CSV** feature periodically to create offline backups of your financial ledger.

## Scripts

```bash
# Start development server on port 3000
npm run dev

# Run TypeScript linting
npm run lint

# Run automated calculation and validation test suite
npm test

# Production build
npm run build
```
