import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Scale,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import {
  getCurrentMonthKey,
  getAvailableMonths,
} from '../utils/dates';
import {
  calculateMonthlyStats,
  calculateCategoryBreakdown,
  calculateHighestSpendingCategory,
} from '../utils/calculations';
import { formatCurrency, formatMonthKey, formatPercentage } from '../utils/formatters';
import { ExpenseChart } from './ExpenseChart';
import { CategoryBreakdown } from './CategoryBreakdown';
import { HighestSpendingCategory } from './HighestSpendingCategory';

export const MonthlyReport: React.FC = () => {
  const { transactions, currency } = useTransactions();

  const availableMonths = useMemo(
    () => getAvailableMonths(transactions),
    [transactions]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    getCurrentMonthKey()
  );

  const monthStats = useMemo(
    () => calculateMonthlyStats(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  const monthTransactions = useMemo(
    () => transactions.filter((tx) => tx.date.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  const monthCategoryStats = useMemo(
    () => calculateCategoryBreakdown(monthTransactions, 'expense'),
    [monthTransactions]
  );

  const highestResult = useMemo(
    () => calculateHighestSpendingCategory(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  return (
    <div className="space-y-6">
      {/* Month Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Monthly Financial Report
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatMonthKey(selectedMonth)} Performance & Comparison
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="month-select"
            className="text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            Select Month:
          </label>
          <div className="relative">
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthKey(m)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Monthly KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Net Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Monthly Net Savings
            </span>
            <Scale className="w-4 h-4 text-slate-400" />
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              monthStats.netBalance > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : monthStats.netBalance < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {formatCurrency(monthStats.netBalance, currency)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {monthStats.income > 0
              ? `${formatPercentage(
                  (monthStats.netBalance / monthStats.income) * 100
                )} savings rate`
              : 'No income this month'}
          </p>
        </div>

        {/* Monthly Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Monthly Income
            </span>
            <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrency(monthStats.income, currency)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {monthTransactions.filter((t) => t.type === 'income').length} income
            records
          </p>
        </div>

        {/* Monthly Expenses + Prior Month Comparison */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Monthly Expenses
            </span>
            <div className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(monthStats.expenses, currency)}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            {monthStats.prevExpenses > 0 && monthStats.expenseDiffPct !== null ? (
              <>
                {monthStats.expenseDiff > 0 ? (
                  <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    +{formatPercentage(Math.abs(monthStats.expenseDiffPct))} vs. prev month
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <TrendingDown className="w-3 h-3" />
                    -{formatPercentage(Math.abs(monthStats.expenseDiffPct))} vs. prev month
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-400">No prior month benchmark</span>
            )}
          </div>
        </div>
      </div>

      {/* Highest Spending Highlight Card */}
      <HighestSpendingCategory
        highestResult={highestResult}
        currency={currency}
      />

      {/* Analytics Visualizations for Selected Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart
          categoryStats={monthCategoryStats}
          totalExpenses={monthStats.expenses}
          currency={currency}
        />
        <CategoryBreakdown stats={monthCategoryStats} currency={currency} />
      </div>
    </div>
  );
};
