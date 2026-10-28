import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  ArrowDownLeft,
  ArrowUpRight,
  Tags,
  PiggyBank,
  Target,
  CalendarClock,
  Repeat,
  BarChart3,
  Sparkles,
  Calculator,
  Settings,
  ShieldCheck,
  X,
  Wallet,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency } from '../utils/formatters';
import type { NavigationTab } from '../types';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: any;
  badge?: number;
  badgeColor?: string;
  highlight?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const {
    activeTab,
    setActiveTab,
    totals,
    currency,
    budgetAlertsCount,
    upcomingBillsCount,
  } = useTransactions();

  const navGroups: NavGroup[] = [
    {
      title: 'Core Accounting',
      items: [
        {
          id: 'dashboard' as NavigationTab,
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'transactions' as NavigationTab,
          label: 'Transactions',
          icon: ReceiptText,
        },
        {
          id: 'income' as NavigationTab,
          label: 'Income Streams',
          icon: ArrowDownLeft,
        },
        {
          id: 'expenses' as NavigationTab,
          label: 'Expenses Ledger',
          icon: ArrowUpRight,
        },
      ],
    },
    {
      title: 'Planning & Wealth',
      items: [
        {
          id: 'categories' as NavigationTab,
          label: 'Categories',
          icon: Tags,
        },
        {
          id: 'budgets' as NavigationTab,
          label: 'Monthly Budgets',
          icon: PiggyBank,
          badge: budgetAlertsCount > 0 ? budgetAlertsCount : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'savings_goals' as NavigationTab,
          label: 'Savings Goals',
          icon: Target,
        },
        {
          id: 'bills' as NavigationTab,
          label: 'Bills & Reminders',
          icon: CalendarClock,
          badge: upcomingBillsCount > 0 ? upcomingBillsCount : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          id: 'subscriptions' as NavigationTab,
          label: 'Subscriptions',
          icon: Repeat,
        },
      ],
    },
    {
      title: 'Analytics & Intelligence',
      items: [
        {
          id: 'reports' as NavigationTab,
          label: 'Financial Reports',
          icon: BarChart3,
        },
        {
          id: 'ai_assistant' as NavigationTab,
          label: 'AI Finance Assistant',
          icon: Sparkles,
          highlight: true,
        },
        {
          id: 'emi_calculator' as NavigationTab,
          label: 'EMI & Savings Tools',
          icon: Calculator,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'settings' as NavigationTab,
          label: 'Settings',
          icon: Settings,
        },
        {
          id: 'profile' as NavigationTab,
          label: 'Profile & Security',
          icon: ShieldCheck,
        },
      ],
    },
  ];

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between overflow-y-auto pr-1">
      <div className="space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold'
                        : item.highlight
                        ? 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.highlight
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          item.badgeColor || 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Net Balance Card at Bottom */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Net Liquid Balance</span>
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div
            className={`text-base font-bold font-mono tabular-nums ${
              totals.totalBalance > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : totals.totalBalance < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {formatCurrency(totals.totalBalance, currency)}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              +{formatCurrency(totals.totalIncome, currency)}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              -{formatCurrency(totals.totalExpenses, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 p-4 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 h-[calc(100vh-4rem)] sticky top-16 overflow-hidden">
        {navContent}
      </aside>

      {/* Mobile Drawer Navigation */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />

          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full p-4 shadow-2xl flex flex-col justify-between z-10 border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span>ExpenseFlow Pro</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">{navContent}</div>
          </div>
        </div>
      )}
    </>
  );
};
