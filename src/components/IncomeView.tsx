import React, { useMemo } from 'react';
import {
  ArrowDownLeft,
  Plus,
  TrendingUp,
  Wallet,
  Briefcase,
  PieChart,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { calculateCategoryBreakdown } from '../utils/calculations';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { getCategoryMeta } from '../utils/categories';
import { TransactionList } from './TransactionList';

export const IncomeView: React.FC = () => {
  const { transactions, totals, currency, setIsAddModalOpen, setEditingTransaction } =
    useTransactions();

  const incomeTransactions = useMemo(
    () => transactions.filter((t) => t.type === 'income'),
    [transactions]
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, 'income'),
    [transactions]
  );

  const averageIncome = useMemo(() => {
    if (incomeTransactions.length === 0) return 0;
    return totals.totalIncome / incomeTransactions.length;
  }, [incomeTransactions, totals.totalIncome]);

  const topSource = useMemo(() => {
    return categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;
  }, [categoryBreakdown]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-5 h-5" />
            </span>
            <span>Income Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track all incoming cash flows, salary, freelance, dividends, and earnings.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income Record</span>
        </button>
      </div>

      {/* Income Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Total Inflow</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totals.totalIncome, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {incomeTransactions.length} recorded payments
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Average Inflow per Entry</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
            {formatCurrency(averageIncome, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Standard deposit volume
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Primary Revenue Stream</span>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
            {topSource ? topSource.category : 'None'}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            {topSource
              ? `${formatPercentage(topSource.percentage)} of all earnings`
              : 'Log your first income'}
          </p>
        </div>
      </div>

      {/* Income Stream Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-400" />
              <span>Earnings by Revenue Stream</span>
            </h2>
            <span className="text-xs text-slate-400">
              {categoryBreakdown.length} active streams
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryBreakdown.map((cat) => {
              const meta = getCategoryMeta(cat.category);
              const Icon = meta.icon;

              return (
                <div
                  key={cat.category}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: meta.bgColor, color: meta.color }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {cat.category}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(cat.amount, currency)}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(cat.percentage, 100)}%`,
                        backgroundColor: meta.color,
                      }}
                      className="h-full rounded-full"
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{cat.transactionCount} transactions</span>
                    <span>{formatPercentage(cat.percentage)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Income Transactions Table */}
      <TransactionList
        fixedType="income"
        title="Income Transactions Ledger"
        showFilters={true}
      />
    </div>
  );
};
