import React, { useState } from 'react';
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { EXPENSE_CATEGORIES, getCategoryMeta } from '../utils/categories';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import type { Category, Budget } from '../types';

export const BudgetsView: React.FC = () => {
  const {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    budgetStatuses,
    budgetAlertsCount,
    currency,
  } = useTransactions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form states
  const [category, setCategory] = useState<Category>(EXPENSE_CATEGORIES[0]);
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [period, setPeriod] = useState(() => new Date().toISOString().substring(0, 7));
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [formError, setFormError] = useState('');

  const currentMonthName = new Date().toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpentInBudgets = budgetStatuses.reduce((sum, bs) => sum + bs.spent, 0);
  const overallRemaining = Math.max(0, totalBudgeted - totalSpentInBudgets);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setCategory(EXPENSE_CATEGORIES[0]);
    setMonthlyLimit('');
    setPeriod(new Date().toISOString().substring(0, 7));
    setAlertThreshold('80');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setCategory(b.category);
    setMonthlyLimit(String(b.monthlyLimit));
    setPeriod(b.period || new Date().toISOString().substring(0, 7));
    setAlertThreshold(String(b.alertThreshold || 80));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = Number(monthlyLimit);
    if (!limit || limit <= 0) {
      setFormError('Please enter a valid monthly limit greater than 0.');
      return;
    }
    const thresh = Number(alertThreshold);
    if (!thresh || thresh < 10 || thresh > 100) {
      setFormError('Alert threshold must be between 10% and 100%.');
      return;
    }
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      setFormError('Please select a valid month and year (YYYY-MM).');
      return;
    }

    if (editingBudget) {
      updateBudget(editingBudget.id, {
        category,
        monthlyLimit: limit,
        period,
        alertThreshold: thresh,
      });
    } else {
      // Check if duplicate category budget exists for this period
      const existing = budgets.find((b) => b.category === category && (b.period || '') === period);
      if (existing) {
        setFormError(`A budget limit for ${category} in ${period} already exists. Please edit it instead.`);
        return;
      }

      addBudget({
        category,
        monthlyLimit: limit,
        period,
        alertThreshold: thresh,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <PiggyBank className="w-5 h-5" />
            </span>
            <span>Monthly Spending Budgets</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Set category limits for {currentMonthName}. Automated alerts at 80% and 100% capacity.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Global Budget Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Budgeted</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            {formatCurrency(totalBudgeted, currency)}
          </p>
          <span className="text-[11px] text-slate-400">Across {budgets.length} categories</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Spent This Month</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            {formatCurrency(totalSpentInBudgets, currency)}
          </p>
          <span className="text-[11px] text-slate-400">
            {totalBudgeted > 0 ? `${formatPercentage((totalSpentInBudgets / totalBudgeted) * 100)} utilized` : 'No active limits'}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Remaining Buffer</span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {formatCurrency(overallRemaining, currency)}
          </p>
          <span className="text-[11px] text-slate-400">Available to spend</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400">Critical Warnings</span>
          <div className="flex items-center gap-2 mt-1">
            <p
              className={`text-xl sm:text-2xl font-bold font-mono ${
                budgetAlertsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {budgetAlertsCount}
            </p>
            {budgetAlertsCount > 0 ? (
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {budgetAlertsCount > 0 ? 'Exceeded or near threshold' : 'All budgets healthy'}
          </span>
        </div>
      </div>

      {/* Budgets List Grid */}
      {budgetStatuses.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Budgets Configured Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Set spending guardrails for categories like Groceries, Housing, or Dining Out. We'll automatically warn you when you approach your limit.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Budget</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetStatuses.map((bs) => {
            const meta = getCategoryMeta(bs.budget.category);
            const Icon = meta.icon;
            const threshold = bs.budget.alertThreshold || 80;

            let statusColor = 'text-emerald-600 dark:text-emerald-400';
            let barColor = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            let statusLabel = 'On Track';

            if (bs.isOver) {
              statusColor = 'text-rose-600 dark:text-rose-400';
              barColor = 'bg-rose-500';
              badgeBg = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
              statusLabel = 'Budget Exceeded (100%+)';
            } else if (bs.isWarning) {
              statusColor = 'text-amber-600 dark:text-amber-400';
              barColor = 'bg-amber-500';
              badgeBg = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
              statusLabel = `Warning (${threshold}%+ reached)`;
            }

            return (
              <div
                key={bs.budget.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-all"
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
                        {bs.budget.category}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeBg} mt-0.5`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(bs.budget)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Edit budget"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBudget(bs.budget.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Delete budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numbers */}
                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Spent: </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(bs.spent, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Limit: </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(bs.budget.monthlyLimit, currency)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(bs.percentage, 100)}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${statusColor}`}>
                      {formatPercentage(bs.percentage)} used
                    </span>
                    <span className="text-slate-400">
                      {bs.remaining > 0
                        ? `${formatCurrency(bs.remaining, currency)} remaining`
                        : `${formatCurrency(bs.spent - bs.budget.monthlyLimit, currency)} over budget`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-600" />
                <span>{editingBudget ? 'Edit Budget Limit' : 'Set Category Budget'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  disabled={Boolean(editingBudget)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Budget Month & Year
                </label>
                <input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Monthly Limit ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Warning Alert Threshold (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 w-12 text-right">
                    {alertThreshold}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  You'll see a warning badge as soon as spending hits {alertThreshold}% of this budget.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs"
                >
                  {editingBudget ? 'Save Changes' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
