import React from 'react';
import { AlertCircle, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import type { FinancialTotals } from '../utils/calculations';

interface SpendingProgressProps {
  totals?: FinancialTotals;
}

export const SpendingProgress: React.FC<SpendingProgressProps> = ({
  totals: propTotals,
}) => {
  const { totals: contextTotals, currency } = useTransactions();
  const totals = propTotals || contextTotals;
  const { totalIncome, totalExpenses, percentageSpent } = totals;

  const hasData = totalIncome > 0 || totalExpenses > 0;
  const isOverBudget = hasData && percentageSpent > 100;
  const isHealthy = hasData && totalIncome > 0 && percentageSpent <= 70;
  const isModerate = hasData && totalIncome > 0 && percentageSpent > 70 && percentageSpent <= 100;

  // Clamped percentage for visual progress bar (0% to 100%)
  const visualPercentage = hasData ? Math.min(Math.max(percentageSpent, 0), 100) : 0;

  // Status message and color
  let statusColor = 'bg-slate-300 dark:bg-slate-700';
  let badgeColor =
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';

  if (isOverBudget) {
    statusColor = 'bg-rose-500';
    badgeColor =
      'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  } else if (isModerate) {
    statusColor = 'bg-amber-500';
    badgeColor =
      'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  } else if (isHealthy) {
    statusColor = 'bg-emerald-500';
    badgeColor =
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Income vs. Spending Ratio
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {totalIncome > 0
              ? `${formatCurrency(totalExpenses, currency)} of ${formatCurrency(
                  totalIncome,
                  currency
                )}`
              : 'No recorded income yet'}
          </span>
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${badgeColor}`}
          >
            {formatPercentage(percentageSpent, 1)} spent
          </span>
        </div>
      </div>

      {/* Progress Track & Bar */}
      <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
        <div
          role="progressbar"
          aria-valuenow={Math.round(percentageSpent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Spending progress: ${percentageSpent.toFixed(1)}%`}
          style={{ width: `${visualPercentage}%` }}
          className={`h-full rounded-full transition-all duration-500 ease-out ${statusColor}`}
        />
      </div>

      {/* Accessible Contextual Caption */}
      <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
        {isOverBudget ? (
          <>
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>
              <strong>Budget Warning:</strong> Expenses exceed total income by{' '}
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {formatCurrency(totalExpenses - totalIncome, currency)}
              </span>
              . Consider reviewing discretionary spending.
            </span>
          </>
        ) : totalIncome === 0 ? (
          <span>
            Record your income transactions to activate budget ratio tracking.
          </span>
        ) : isHealthy ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Healthy financial pace! You have retained{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {formatPercentage(100 - percentageSpent, 1)}
              </strong>{' '}
              ({formatCurrency(totalIncome - totalExpenses, currency)}) of your
              income.
            </span>
          </>
        ) : (
          <span>
            You have spent {formatPercentage(percentageSpent, 1)} of your
            income. Remaining buffer:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {formatCurrency(totalIncome - totalExpenses, currency)}
            </strong>
            .
          </span>
        )}
      </div>
    </div>
  );
};
