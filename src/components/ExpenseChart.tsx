import React, { useState } from 'react';
import type { CategoryStat } from '../utils/calculations';
import { getCategoryMeta } from '../utils/categories';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface ExpenseChartProps {
  categoryStats: CategoryStat[];
  totalExpenses: number;
  currency: string;
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({
  categoryStats,
  totalExpenses,
  currency,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const radius = 70;
  const strokeWidth = 26;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  // Compute accumulated stroke offsets for SVG donut
  let cumulativePercentage = 0;
  const slices = categoryStats.map((stat) => {
    const meta = getCategoryMeta(stat.category);
    const strokeDasharray = `${(stat.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
    cumulativePercentage += stat.percentage;

    return {
      ...stat,
      meta,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeStat = hoveredCategory
    ? categoryStats.find((s) => s.category === hoveredCategory)
    : null;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Expense Allocation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Breakdown across spending categories
          </p>
        </div>
      </div>

      {categoryStats.length === 0 || totalExpenses === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <span className="text-xs font-medium">No expenses</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
            Add your first transaction to view your financial analytics.
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Native SVG Donut Chart */}
          <div className="relative w-52 h-52 shrink-0">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full -rotate-90 transform"
              aria-label="Category spending donut chart"
            >
              {/* Background track circle */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-100 dark:text-slate-800/80"
              />

              {/* Slices */}
              {slices.map((slice) => {
                const isHovered = hoveredCategory === slice.category;
                return (
                  <circle
                    key={slice.category}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={slice.meta.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-200 cursor-pointer hover:opacity-90"
                    onMouseEnter={() => setHoveredCategory(slice.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              {activeStat ? (
                <>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate max-w-[120px]">
                    {activeStat.category}
                  </span>
                  <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCurrency(activeStat.amount, currency)}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    {formatPercentage(activeStat.percentage)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCurrency(totalExpenses, currency)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {categoryStats.length} categories
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Category Legend & List */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categoryStats.map((stat) => {
              const meta = getCategoryMeta(stat.category);
              const Icon = meta.icon;
              const isHovered = hoveredCategory === stat.category;

              return (
                <div
                  key={stat.category}
                  onMouseEnter={() => setHoveredCategory(stat.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-2xs'
                      : 'border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {stat.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs tabular-nums">
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">
                      {formatCurrency(stat.amount, currency)}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {formatPercentage(stat.percentage)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
