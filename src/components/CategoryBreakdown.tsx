import React from 'react';
import type { CategoryStat } from '../utils/calculations';
import { getCategoryMeta } from '../utils/categories';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface CategoryBreakdownProps {
  stats: CategoryStat[];
  currency: string;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  stats,
  currency,
}) => {
  if (stats.length === 0) {
    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Category Spending Breakdown
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No expense transactions recorded for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Category Breakdown
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ranked by total spending volume
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400">
          {stats.length} {stats.length === 1 ? 'Category' : 'Categories'}
        </span>
      </div>

      <div className="space-y-3.5">
        {stats.map((stat) => {
          const meta = getCategoryMeta(stat.category);
          const Icon = meta.icon;

          return (
            <div key={stat.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: meta.bgColor,
                      color: meta.color,
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {stat.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({stat.transactionCount}{' '}
                    {stat.transactionCount === 1 ? 'tx' : 'txs'})
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(stat.amount, currency)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 w-12 text-right">
                    {formatPercentage(stat.percentage)}
                  </span>
                </div>
              </div>

              {/* Progress track & bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(stat.percentage, 100)}%`,
                    backgroundColor: meta.color,
                  }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
