import React, { useState, useMemo } from 'react';
import {
  Tags,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Plus,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  getCategoryMeta,
} from '../utils/categories';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import type { Category } from '../types';

export const CategoriesView: React.FC = () => {
  const { transactions, currency, setActiveTab, setIsAddModalOpen, setEditingTransaction } =
    useTransactions();

  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Category statistics map
  const categoryStats = useMemo(() => {
    const stats: Record<
      string,
      { total: number; count: number; type: 'income' | 'expense' }
    > = {};

    // Initialize all known categories
    INCOME_CATEGORIES.forEach((cat) => {
      stats[cat] = { total: 0, count: 0, type: 'income' };
    });
    EXPENSE_CATEGORIES.forEach((cat) => {
      stats[cat] = { total: 0, count: 0, type: 'expense' };
    });

    // Populate from transactions
    transactions.forEach((tx) => {
      if (!stats[tx.category]) {
        stats[tx.category] = { total: 0, count: 0, type: tx.type };
      }
      stats[tx.category].total += tx.amount;
      stats[tx.category].count += 1;
    });

    return stats;
  }, [transactions]);

  // Overall totals for percentage
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const categoriesList = useMemo(() => {
    const all = [
      ...EXPENSE_CATEGORIES.map((c) => ({ name: c, type: 'expense' as const })),
      ...INCOME_CATEGORIES.map((c) => ({ name: c, type: 'income' as const })),
    ];

    return all.filter((item) => {
      if (activeTabFilter !== 'all' && item.type !== activeTabFilter) return false;
      if (searchQuery.trim()) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      }
      return true;
    });
  }, [activeTabFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Tags className="w-5 h-5" />
            </span>
            <span>Financial Categories</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and monitor activity across all {EXPENSE_CATEGORIES.length + INCOME_CATEGORIES.length} system categories.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTabFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            All Categories ({EXPENSE_CATEGORIES.length + INCOME_CATEGORIES.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('expense')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTabFilter === 'expense'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
            Expenses ({EXPENSE_CATEGORIES.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('income')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTabFilter === 'income'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
            Income ({INCOME_CATEGORIES.length})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoriesList.map((cat) => {
          const meta = getCategoryMeta(cat.name);
          const Icon = meta.icon;
          const stat = categoryStats[cat.name] || { total: 0, count: 0, type: cat.type };
          const denom = cat.type === 'income' ? totalIncome : totalExpense;
          const percentage = denom > 0 ? (stat.total / denom) * 100 : 0;

          return (
            <div
              key={cat.name}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: meta.bgColor, color: meta.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {cat.name}
                    </h3>
                    <span
                      className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider ${
                        cat.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {cat.type}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(stat.total, currency)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: meta.color,
                    }}
                    className="h-full rounded-full transition-all"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{stat.count} logged transactions</span>
                  <span>{formatPercentage(percentage)} of {cat.type}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Receipt className="w-3 h-3" />
                  <span>View in Ledger</span>
                </button>

                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsAddModalOpen(true);
                  }}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Log entry</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
