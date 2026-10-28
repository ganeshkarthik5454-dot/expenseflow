import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Coins,
  Download,
  Trash2,
  ShieldCheck,
  HardDrive,
  Info,
  CheckCircle2,
  Cloud,
  LogIn,
  LogOut,
  User as UserIcon,
  RefreshCw,
  Activity,
  Server,
  Zap,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { SUPPORTED_CURRENCIES } from '../utils/formatters';
import { ConfirmModal } from './ConfirmModal';

export const SettingsView: React.FC = () => {
  const {
    theme,
    setTheme,
    currency,
    setCurrency,
    transactions,
    exportCSV,
    clearAllData,
    currentUser,
    signInWithGoogle,
    logOut,
    isSyncing,
    realtimeStatus,
    activeClientsCount,
    lastPingMs,
    pingBackend,
  } = useTransactions();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const handleConfirmClear = () => {
    clearAllData();
    setIsClearModalOpen(false);
  };

  const handleTestPing = async () => {
    setIsPinging(true);
    await pingBackend();
    setIsPinging(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Preferences & Data Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure real-time full-stack sync, cloud database, application appearance, and local storage.
        </p>
      </div>

      {/* SECTION 1: Full-Stack Real-Time Connection */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Full-Stack Real-Time Engine
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Express backend server running on port 3000 with Server-Sent Events (SSE) broadcast.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg border ${
                realtimeStatus === 'connected'
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                  : realtimeStatus === 'connecting'
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  realtimeStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : realtimeStatus === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span className="capitalize">{realtimeStatus}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Server className="w-3.5 h-3.5" />
              <span>Backend Architecture</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Express + Vite Dev SPA
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Port 3000 (/api/realtime)</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Connected Clients</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {activeClientsCount} {activeClientsCount === 1 ? 'Tab / Device' : 'Tabs / Devices'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bi-directional event broadcast</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Round-trip Latency</span>
              <button
                onClick={handleTestPing}
                disabled={isPinging}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                <span>Ping</span>
              </button>
            </div>
            <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {lastPingMs !== null ? `${lastPingMs} ms` : 'Untested'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Live latency to /api/health</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Firebase Cloud Synchronization */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Firebase Cloud Sync
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cloud Firestore database: <code className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">ai-studio-expenseflowperso-88ab2469-f43b-4159-a65d-ae9424b7f535</code>
              </p>
            </div>
          </div>

          {currentUser && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isSyncing ? 'Syncing...' : 'Connected'}</span>
            </span>
          )}
        </div>

        {currentUser ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser.displayName || 'Google Account'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => logOut()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Connect Google Account for Cloud Sync
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                Sign in with your Google account to automatically mirror your transactions in Cloud Firestore. If you are offline or unauthenticated, ExpenseFlow falls back to browser localStorage.
              </p>
            </div>

            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </div>

      {/* SECTION 3: Appearance / Theme */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Interface Theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select between high-contrast light mode and deep slate dark mode.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md pt-1">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light Mode</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Dark Mode</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: Currency Preference */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Display Currency
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Default is Indian Rupee (INR). Formats all balances and ledgers using standard international notations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {SUPPORTED_CURRENCIES.map((cur) => {
            const isSelected = cur.code === currency;
            return (
              <button
                key={cur.code}
                onClick={() => setCurrency(cur.code)}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span>{cur.name}</span>
                <span className="font-mono text-slate-400 font-bold">
                  {cur.symbol}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Note:</strong> Selecting a different display currency changes the visual currency symbol and numeric grouping format. It does not perform foreign exchange rate conversions on historical entries.
          </span>
        </div>
      </div>

      {/* SECTION 5: Data Management & Export */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Data Management & Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export your data for external spreadsheets or wipe local entries safely.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Export Transaction Records
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Download all {transactions.length} transactions as a UTF-8 CSV file compatible with Excel and Google Sheets.
            </p>
          </div>

          <button
            onClick={() => exportCSV()}
            disabled={transactions.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Clear All Transaction Data
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Permanently wipe all transaction entries from this device and your cloud database. Theme and currency choices will be preserved.
            </p>
          </div>

          <button
            onClick={() => setIsClearModalOpen(true)}
            disabled={transactions.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* SECTION 6: Architecture & Privacy Notice */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Hybrid Architecture & Security
          </h3>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          ExpenseFlow uses a <strong>hybrid real-time architecture</strong>: records synchronize instantaneously via an Express Server-Sent Events (SSE) stream across open tabs and are persisted to Cloud Firestore when signed in.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Express backend SSE live broadcast</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Firebase Cloud Firestore onSnapshot sync</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Automatic offline-first local recovery</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Formula injection protected CSV exports</span>
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Dialog */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear All Transaction Data?"
        message="This operation will permanently delete all transaction records from your browser's local storage and your cloud database. This action cannot be undone. Are you sure you want to proceed?"
        confirmLabel="Clear All Data"
        cancelLabel="Keep My Data"
        isDestructive={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
