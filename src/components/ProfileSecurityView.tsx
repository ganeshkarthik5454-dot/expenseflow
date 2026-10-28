import React, { useState } from 'react';
import {
  ShieldCheck,
  User as UserIcon,
  LogIn,
  LogOut,
  Download,
  Lock,
  Database,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FileCode,
  KeyRound,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';

export const ProfileSecurityView: React.FC = () => {
  const {
    currentUser,
    signInWithGoogle,
    logOut,
    transactions,
    budgets,
    savingsGoals,
    bills,
    subscriptions,
    currency,
    theme,
    showNotification,
  } = useTransactions();

  const [isExporting, setIsExporting] = useState(false);

  const handleExportFullBackup = () => {
    setIsExporting(true);
    try {
      const backupData = {
        app: 'ExpenseFlow Pro',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        user: currentUser
          ? { uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName }
          : 'guest_local_user',
        preferences: {
          currency,
          theme,
        },
        data: {
          transactions,
          budgets,
          savingsGoals,
          bills,
          subscriptions,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ExpenseFlow_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('success', 'Complete financial data backup downloaded successfully.');
    } catch (e) {
      showNotification('error', 'Failed to generate JSON backup.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <span>Profile & Data Security</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          User identity, cloud authorization, end-to-end data isolation, and backup management.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                <UserIcon className="w-7 h-7" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {currentUser?.displayName || 'Local Guest Account'}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    currentUser
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {currentUser ? 'Cloud Verified' : 'Local Workspace'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser?.email || 'Data stored safely in your browser storage and backend ledger'}
              </p>
            </div>
          </div>

          <div>
            {currentUser ? (
              <button
                onClick={logOut}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Auth details breakdown */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-0.5">User ID</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">
              {currentUser?.uid || 'guest_device_session'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-0.5">Authentication Provider</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {currentUser ? 'Google OAuth 2.0 (Firebase)' : 'Browser Local Storage'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-0.5">Database Security Rules</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>User-Isolated Rules Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Data Isolation & Security Architecture */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Multi-Tenant Security Architecture</span>
        </h3>

        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            • **User-Isolated Storage Paths**: When signed in with Google, all your financial ledgers and settings are kept strictly isolated under <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">/users/{'{userId}'}/*</code>. No other user can query or read your records.
          </p>
          <p>
            • **Offline-Resilient Local Mirror**: ExpenseFlow uses high-speed local mirrors with validation schemas to allow seamless instant responsiveness even with network interruptions.
          </p>
          <p>
            • **Zero Data Selling**: Your numbers are never shared or indexed by public scrapers.
          </p>
        </div>
      </div>

      {/* Complete Data Backup JSON Export */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-600" />
              <span>Full Data Export & Backup</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Export an unencrypted JSON file containing all your {transactions.length} transactions, {budgets.length} budgets, {savingsGoals.length} savings goals, and {bills.length} bills.
            </p>
          </div>

          <button
            onClick={handleExportFullBackup}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
