import React, { useState, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  Clock,
  Target,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import {
  calculateTotals,
  calculateCategoryBreakdown,
  calculateHighestSpendingCategory,
} from '../utils/calculations';
import { isDateMatchingFilter, getTodayDateString } from '../utils/dates';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { SummaryCards } from './SummaryCards';
import { SpendingProgress } from './SpendingProgress';
import { ExpenseChart } from './ExpenseChart';
import { CategoryBreakdown } from './CategoryBreakdown';
import { HighestSpendingCategory } from './HighestSpendingCategory';
import { TransactionList } from './TransactionList';
import type { DateFilterOption } from '../types';

export const DashboardView: React.FC = () => {
  const {
    transactions,
    totals,
    currency,
    setActiveTab,
    budgetStatuses,
    budgetAlertsCount,
    bills,
    savingsGoals,
  } = useTransactions();

  const [dateFilter, setDateFilter] = useState<'all' | DateFilterOption>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Filter transactions based on dashboard date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) =>
      isDateMatchingFilter(tx.date, dateFilter, customStart, customEnd)
    );
  }, [transactions, dateFilter, customStart, customEnd]);

  const dashboardTotals = useMemo(
    () => calculateTotals(filteredTransactions),
    [filteredTransactions]
  );

  const expenseStats = useMemo(
    () => calculateCategoryBreakdown(filteredTransactions, 'expense'),
    [filteredTransactions]
  );

  const highestResult = useMemo(
    () => calculateHighestSpendingCategory(filteredTransactions),
    [filteredTransactions]
  );

  // Critical budget warnings (>= 80%)
  const warningBudgets = useMemo(
    () => budgetStatuses.filter((b) => b.isWarning || b.isOver),
    [budgetStatuses]
  );

  // Upcoming bills due in the next 7 days or overdue
  const urgentBills = useMemo(() => {
    const today = getTodayDateString();
    return bills.filter(
      (b) => b.status === 'overdue' || (b.status === 'upcoming' && b.dueDate <= today)
    );
  }, [bills]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner / Overview Heading with Date Filter Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time balance, budgets, savings progress, and wealth intelligence.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'this_year', label: 'This Year' },
            { id: 'all', label: 'All Time' },
          ].map((df) => (
            <button
              key={df.id}
              onClick={() => setDateFilter(df.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                dateFilter === df.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>
      </div>

      {/* Urgent Alerts Strip (Budget Exceeded or Bills Overdue) */}
      {(warningBudgets.length > 0 || urgentBills.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in">
          {warningBudgets.length > 0 && (
            <div
              onClick={() => setActiveTab('budgets')}
              className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 flex items-center justify-between cursor-pointer hover:bg-rose-100/70 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <p className="text-xs text-rose-900 dark:text-rose-200 truncate">
                  <strong>Budget Alert:</strong> {warningBudgets[0].budget.category} is at{' '}
                  <span className="font-bold">{warningBudgets[0].percentage}%</span> of monthly limit.
                  {warningBudgets.length > 1 && ` (+${warningBudgets.length - 1} more)`}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-2" />
            </div>
          )}

          {urgentBills.length > 0 && (
            <div
              onClick={() => setActiveTab('bills')}
              className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-xs text-amber-900 dark:text-amber-200 truncate">
                  <strong>Due Bill Reminder:</strong> {urgentBills[0].title} (
                  {formatCurrency(urgentBills[0].amount, currency)}) is due.
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-2" />
            </div>
          )}
        </div>
      )}

      {/* Summary Metrics Cards */}
      <SummaryCards
        totals={dashboardTotals}
        transactions={filteredTransactions}
      />

      {/* Spending Progress & Budget Ratio */}
      <SpendingProgress totals={dashboardTotals} />

      {/* Savings Goals Spotlight Mini-Grid */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Savings Goals
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('savings_goals')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{savingsGoals.length > 0 ? 'Manage Goals' : 'Create Savings Goal'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {savingsGoals.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No savings goals created yet. Set targets for emergencies, vacation, vehicle, or big purchases.
            </p>
            <button
              onClick={() => setActiveTab('savings_goals')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Create Savings Goal</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {savingsGoals.slice(0, 3).map((goal) => {
              const pct = Math.min(
                100,
                Math.round((goal.currentAmount / goal.targetAmount) * 100)
              );
              return (
                <div
                  key={goal.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {goal.title}
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {pct}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%`, backgroundColor: goal.color || '#059669' }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{formatCurrency(goal.currentAmount, currency)}</span>
                    <span>Target: {formatCurrency(goal.targetAmount, currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics Row: Donut Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart
          categoryStats={expenseStats}
          totalExpenses={dashboardTotals.totalExpenses}
          currency={currency}
        />
        <CategoryBreakdown stats={expenseStats} currency={currency} />
      </div>

      {/* Highest Spending Highlight */}
      <HighestSpendingCategory
        highestResult={highestResult}
        currency={currency}
      />

      {/* Recent Transactions Ledger Preview */}
      <TransactionList
        maxItems={6}
        showFilters={false}
        title="Recent Transactions"
        onViewAll={() => setActiveTab('transactions')}
      />
    </div>
  );
};
