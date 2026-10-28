import React from 'react';
import { Flame, Info } from 'lucide-react';
import type { HighestSpendingResult } from '../utils/calculations';
import { getCategoryMeta } from '../utils/categories';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface HighestSpendingCategoryProps {
  highestResult: HighestSpendingResult;
  currency: string;
}

export const HighestSpendingCategory: React.FC<
  HighestSpendingCategoryProps
> = ({ highestResult, currency }) => {
  if (!highestResult.category) {
    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Top Spending Category
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {highestResult.summary}
          </p>
        </div>
      </div>
    );
  }

  const meta = getCategoryMeta(highestResult.category);
  const Icon = meta.icon;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Peak Expense Area
          </span>
        </div>

        <span className="text-xs font-semibold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
          {formatPercentage(highestResult.percentage)} of total
        </span>
      </div>

      <div className="flex items-center gap-4 mt-2">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: meta.bgColor, color: meta.color }}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
            {highestResult.category}
          </h3>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(highestResult.amount, currency)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3">
        {highestResult.summary}
      </p>
    </div>
  );
};
