import React, { useMemo } from 'react';
import {
  ArrowUpRight,
  Plus,
  TrendingDown,
  CreditCard,
  Flame,
  PieChart,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { calculateCategoryBreakdown, calculateHighestSpendingCategory } from '../utils/calculations';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { getCategoryMeta } from '../utils/categories';
import { TransactionList } from './TransactionList';

export const ExpensesView: React.FC = () => {
  const { transactions, totals, currency, setIsAddModalOpen, setEditingTransaction } =
    useTransactions();

  const expenseTransactions = useMemo(
    () => transactions.filter((t) => t.type === 'expense'),
    [transactions]
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, 'expense'),
    [transactions]
  );

  const averageExpense = useMemo(() => {
    if (expenseTransactions.length === 0) return 0;
    return totals.totalExpenses / expenseTransactions.length;
  }, [expenseTransactions, totals.totalExpenses]);

  const highestResult = useMemo(
    () => calculateHighestSpendingCategory(transactions),
    [transactions]
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-5 h-5" />
            </span>
            <span>Expenses Ledger & Spending</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze money going out, track expenses by category, and eliminate unnecessary spending.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense Record</span>
        </button>
      </div>

      {/* Expense Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Total Outflow</span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(totals.totalExpenses, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {expenseTransactions.length} recorded purchases
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Average Expense per Entry</span>
            <TrendingDown className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
            {formatCurrency(averageExpense, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Typical checkout volume
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Highest Spending Category</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
            {highestResult.category || 'None'}
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
            {highestResult.category
              ? `${formatCurrency(highestResult.amount, currency)} (${formatPercentage(highestResult.percentage)})`
              : 'Log your first expense'}
          </p>
        </div>
      </div>

      {/* Category Spending Breakdown Grid */}
      {categoryBreakdown.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-slate-400" />
              <span>Expenditure by Category</span>
            </h2>
            <span className="text-xs text-slate-400">
              {categoryBreakdown.length} active spending channels
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryBreakdown.map((cat) => {
              const meta = getCategoryMeta(cat.category);
              const Icon = meta.icon;

              return (
                <div
                  key={cat.category}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: meta.bgColor, color: meta.color }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {cat.category}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(cat.amount, currency)}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(cat.percentage, 100)}%`,
                        backgroundColor: meta.color,
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{cat.transactionCount} transactions</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatPercentage(cat.percentage)} of total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <TransactionList
        fixedType="expense"
        title="Expense Transactions Ledger"
        showFilters={true}
      />
    </div>
  );
};
