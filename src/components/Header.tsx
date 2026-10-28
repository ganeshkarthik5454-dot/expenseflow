import React, { useState } from 'react';
import {
  Wallet,
  Sun,
  Moon,
  Download,
  Plus,
  Menu,
  Coins,
  ChevronDown,
  LogIn,
  LogOut,
  Cloud,
  User as UserIcon,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { formatHeaderDate } from '../utils/dates';
import { SUPPORTED_CURRENCIES } from '../utils/formatters';

interface HeaderProps {
  onOpenMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileNav }) => {
  const {
    theme,
    toggleTheme,
    currency,
    setCurrency,
    setIsAddModalOpen,
    exportCSV,
    currentUser,
    signInWithGoogle,
    logOut,
    isSyncing,
    realtimeStatus,
    activeClientsCount,
  } = useTransactions();

  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const formattedDate = formatHeaderDate();
  const currentCurrency =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency) ||
    SUPPORTED_CURRENCIES[0];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a
            href="/"
            className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold tracking-tight text-lg sm:text-xl whitespace-nowrap group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shadow-emerald-500/20 group-hover:bg-emerald-500 transition-colors">
              <Wallet className="w-4 h-4" />
            </div>
            <span>ExpenseFlow</span>
          </a>
        </div>

        {/* Zone 2: Date contextual label & Real-Time connection indicator */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
          <span>{formattedDate}</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
          <div
            title={`Full-stack realtime sync ${realtimeStatus} (${activeClientsCount} connected client${activeClientsCount > 1 ? 's' : ''})`}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300"
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
            <span>
              {realtimeStatus === 'connected'
                ? 'Realtime Live'
                : realtimeStatus === 'connecting'
                ? 'Connecting...'
                : 'Offline'}
            </span>
          </div>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCurrencyDropdownOpen((prev) => !prev)}
              aria-label="Select display currency"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {currentCurrency.code} ({currentCurrency.symbol})
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCurrencyDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCurrencyDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Display Currency
                  </div>
                  {SUPPORTED_CURRENCIES.map((cur) => (
                    <button
                      key={cur.code}
                      onClick={() => {
                        setCurrency(cur.code);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                        cur.code === currency
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{cur.name}</span>
                      <span className="font-mono text-slate-400">
                        {cur.symbol}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Export CSV action */}
          <button
            onClick={() => exportCSV()}
            aria-label="Export transactions to CSV"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>

          {/* Google Firebase User Account / Sign In */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                aria-label="User account menu"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[80px] sm:max-w-[120px] truncate">
                  {currentUser.displayName?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isUserDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {currentUser.displayName || 'Google User'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{isSyncing ? 'Syncing...' : 'Firebase Cloud Sync Active'}</span>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        logOut();
                      }}
                      className="w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Sign in</span>
            </button>
          )}

          {/* Add Transaction Primary CTA */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>
    </header>
  );
};
